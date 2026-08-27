import {
  connect,
  type ChannelModel,
  type ConfirmChannel,
  type ConsumeMessage,
} from "amqplib";

import Environment from "../config/Environment";
import { TaskEventType, type TaskEvent } from "../domain/TaskEvents";
import InvalidTaskEventError from "../errors/EventErrors";
import type TaskEventParser from "../parsers/TaskEventParser";
import type NotificationService from "../services/NotificationService";

class RabbitMqTaskEventConsumer {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private running = false;
  private connecting = false;
  private readonly retryExchange = `${Environment.rabbitMqQueue}.retry-exchange`;
  private readonly retryQueue = `${Environment.rabbitMqQueue}.retry`;
  private readonly deadLetterExchange =
    `${Environment.rabbitMqQueue}.dead-letter-exchange`;
  private readonly deadLetterQueue =
    `${Environment.rabbitMqQueue}.dead-letter`;

  constructor(
    private readonly parser: TaskEventParser,
    private readonly notificationService: NotificationService
  ) {}

  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    this.scheduleConnection(0);
  }

  async close(): Promise<void> {
    this.running = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const channel = this.channel;
    const connection = this.connection;

    this.channel = null;
    this.connection = null;

    if (channel) {
      await channel.close().catch(() => undefined);
    }

    if (connection) {
      await connection.close().catch(() => undefined);
    }
  }

  private scheduleConnection(delay: number): void {
    if (!this.running || this.reconnectTimer) {
      return;
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connectAndConsume();
    }, delay);
  }

  private async connectAndConsume(): Promise<void> {
    if (!this.running || this.connecting || this.connection) {
      return;
    }

    this.connecting = true;
    let connection: ChannelModel | null = null;
    let channel: ConfirmChannel | null = null;
    let connectionClosed = false;
    let channelClosed = false;
    let consumerCancelled = false;

    try {
      connection = await connect(Environment.rabbitMqUrl, { timeout: 5_000 });

      connection.on("error", (error) => {
        console.error("RabbitMQ connection error.", error);
      });
      connection.on("close", () => {
        connectionClosed = true;

        if (this.connection !== connection) {
          return;
        }

        this.connection = null;
        this.channel = null;
        console.warn("RabbitMQ disconnected; reconnection is scheduled.");
        this.scheduleConnection(2_000);
      });

      if (!this.running) {
        await connection.close();
        return;
      }

      const activeChannel = await connection.createConfirmChannel();
      channel = activeChannel;

      activeChannel.on("error", (error) => {
        console.error("RabbitMQ notification channel error.", error);
      });
      activeChannel.on("handler-error", (error, eventName) => {
        console.error(`RabbitMQ channel ${eventName} handler failed.`, error);
      });
      activeChannel.on("close", () => {
        channelClosed = true;

        if (this.channel === activeChannel && this.connection === connection) {
          void connection?.close().catch(() => undefined);
        }
      });

      await this.assertTopology(activeChannel);
      await activeChannel.prefetch(Environment.rabbitMqPrefetch);
      await activeChannel.consume(
        Environment.rabbitMqQueue,
        (message) => {
          if (message === null) {
            consumerCancelled = true;
            console.warn("RabbitMQ cancelled the task-event consumer.");

            if (
              this.channel === activeChannel &&
              this.connection === connection
            ) {
              void connection?.close().catch((error: unknown) => {
                console.error(
                  "RabbitMQ connection could not close after cancellation.",
                  error
                );
              });
            }

            return;
          }

          void this.handleMessage(activeChannel, message).catch(
            (error: unknown) => {
              console.error("Task-event delivery could not be handled.", error);
              this.requeueSafely(activeChannel, message);
            }
          );
        },
        { noAck: false }
      );

      if (
        !this.running ||
        connectionClosed ||
        channelClosed ||
        consumerCancelled
      ) {
        throw new Error("RabbitMQ consumer closed during setup.");
      }

      this.connection = connection;
      this.channel = activeChannel;

      console.log("Notification Service connected to RabbitMQ.");
    } catch (error) {
      console.warn("RabbitMQ connection attempt failed; retrying.", error);

      if (channel) {
        await channel.close().catch(() => undefined);
      }

      if (connection) {
        await connection.close().catch(() => undefined);
      }

      this.scheduleConnection(2_000);
    } finally {
      this.connecting = false;
    }
  }

  private async assertTopology(channel: ConfirmChannel): Promise<void> {
    await channel.assertExchange(Environment.rabbitMqExchange, "topic", {
      durable: true,
    });
    await channel.assertExchange(this.retryExchange, "direct", {
      durable: true,
    });
    await channel.assertExchange(this.deadLetterExchange, "topic", {
      durable: true,
    });

    await channel.assertQueue(Environment.rabbitMqQueue, {
      durable: true,
      deadLetterExchange: this.deadLetterExchange,
    });
    await channel.assertQueue(this.retryQueue, {
      durable: true,
      messageTtl: Environment.rabbitMqRetryDelayMs,
      deadLetterExchange: Environment.rabbitMqExchange,
    });
    await channel.assertQueue(this.deadLetterQueue, { durable: true });

    for (const routingKey of Object.values(TaskEventType)) {
      await channel.bindQueue(
        Environment.rabbitMqQueue,
        Environment.rabbitMqExchange,
        routingKey
      );
      await channel.bindQueue(this.retryQueue, this.retryExchange, routingKey);
      await channel.bindQueue(
        this.deadLetterQueue,
        this.deadLetterExchange,
        routingKey
      );
    }
  }

  private async handleMessage(
    channel: ConfirmChannel,
    message: ConsumeMessage
  ): Promise<void> {
    let event: TaskEvent;

    try {
      event = this.parser.parse(
        message.content,
        message.fields.routingKey,
        message.properties
      );
    } catch (error) {
      if (error instanceof InvalidTaskEventError) {
        console.warn(`Dead-lettering invalid task event: ${error.message}`);
        channel.reject(message, false);
        return;
      }

      throw error;
    }

    try {
      await this.notificationService.record(event);
      channel.ack(message);
    } catch (error) {
      await this.retryOrDeadLetter(channel, message, event, error);
    }
  }

  private async retryOrDeadLetter(
    channel: ConfirmChannel,
    message: ConsumeMessage,
    event: TaskEvent,
    error: unknown
  ): Promise<void> {
    const retryCount = this.readRetryCount(
      message.properties.headers?.["x-retry-count"]
    );

    if (retryCount >= Environment.rabbitMqMaxRetries) {
      console.error(
        `Dead-lettering event ${event.eventId} after ${retryCount} retries.`,
        error
      );
      channel.reject(message, false);
      return;
    }

    channel.publish(
      this.retryExchange,
      event.eventType,
      message.content,
      {
        persistent: true,
        contentType: "application/json",
        contentEncoding: "utf-8",
        messageId: event.eventId,
        type: event.eventType,
        timestamp: Math.floor(Date.now() / 1_000),
        headers: {
          "x-retry-count": retryCount + 1,
        },
      }
    );
    await channel.waitForConfirms();
    channel.ack(message);

    console.warn(
      `Scheduled retry ${retryCount + 1}/${Environment.rabbitMqMaxRetries} ` +
        `for event ${event.eventId}.`
    );
  }

  private readRetryCount(value: unknown): number {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
      return 0;
    }

    return value;
  }

  private requeueSafely(
    channel: ConfirmChannel,
    message: ConsumeMessage
  ): void {
    try {
      channel.nack(message, false, true);
    } catch (error) {
      console.error("Task event could not be requeued cleanly.", error);
    }
  }
}

export default RabbitMqTaskEventConsumer;
