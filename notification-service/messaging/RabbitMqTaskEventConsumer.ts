import {
  type ChannelModel,
  type ConfirmChannel,
  type ConsumeMessage,
} from "amqplib";
import { inject, injectable } from "inversify";

import type { NotificationConfig } from "../config/NotificationConfig";
import {
  TaskEventType,
  type TaskEvent,
} from "../contracts/events/TaskEvents";
import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import InvalidTaskEventError from "../errors/EventErrors";
import type {
  RabbitMqConnectionFactoryPort,
  RetryPublisherPort,
  TaskEventConsumerPort,
  TaskEventParserPort,
} from "../ports/InfrastructurePorts";
import type { NotificationServicePort } from "../ports/ServicePorts";

@injectable()
class RabbitMqTaskEventConsumer implements TaskEventConsumerPort {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private running = false;
  private connecting = false;
  private readonly retryExchange: string;
  private readonly retryQueue: string;
  private readonly deadLetterExchange: string;
  private readonly deadLetterQueue: string;

  constructor(
    @inject(ServiceIdentifiers.TaskEventParser)
    private readonly parser: TaskEventParserPort,
    @inject(ServiceIdentifiers.NotificationService)
    private readonly notificationService: NotificationServicePort,
    @inject(ServiceIdentifiers.RabbitMqConnectionFactory)
    private readonly connectionFactory: RabbitMqConnectionFactoryPort,
    @inject(ServiceIdentifiers.RetryPublisher)
    private readonly retryPublisher: RetryPublisherPort,
    @inject(ServiceIdentifiers.Config)
    private readonly config: NotificationConfig
  ) {
    this.retryExchange = `${config.rabbitMq.queue}.retry-exchange`;
    this.retryQueue = `${config.rabbitMq.queue}.retry`;
    this.deadLetterExchange = `${config.rabbitMq.queue}.dead-letter-exchange`;
    this.deadLetterQueue = `${config.rabbitMq.queue}.dead-letter`;
  }

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
      connection = await this.connectionFactory.connect();

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
      await activeChannel.prefetch(this.config.rabbitMq.prefetch);
      await activeChannel.consume(
        this.config.rabbitMq.queue,
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
    await channel.assertExchange(this.config.rabbitMq.exchange, "topic", {
      durable: true,
    });
    await channel.assertExchange(this.retryExchange, "direct", {
      durable: true,
    });
    await channel.assertExchange(this.deadLetterExchange, "topic", {
      durable: true,
    });

    await channel.assertQueue(this.config.rabbitMq.queue, {
      durable: true,
      deadLetterExchange: this.deadLetterExchange,
    });
    await channel.assertQueue(this.retryQueue, {
      durable: true,
      messageTtl: this.config.rabbitMq.retryDelayMilliseconds,
      deadLetterExchange: this.config.rabbitMq.exchange,
    });
    await channel.assertQueue(this.deadLetterQueue, { durable: true });

    for (const routingKey of Object.values(TaskEventType)) {
      await channel.bindQueue(
        this.config.rabbitMq.queue,
        this.config.rabbitMq.exchange,
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

    if (retryCount >= this.config.rabbitMq.maxRetries) {
      console.error(
        `Dead-lettering event ${event.eventId} after ${retryCount} retries.`,
        error
      );
      channel.reject(message, false);
      return;
    }

    await this.retryPublisher.publish(
      channel,
      message,
      event,
      retryCount + 1
    );
    channel.ack(message);

    console.warn(
      `Scheduled retry ${retryCount + 1}/${this.config.rabbitMq.maxRetries} ` +
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
