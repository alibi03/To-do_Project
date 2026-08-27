import amqp, {
  type ChannelModel,
  type ConfirmChannel,
} from "amqplib";

import Environment from "../config/Environment";
import type { TaskEvent } from "../events/TaskEvents";

class RabbitMqPublisher {
  private connection: ChannelModel | null = null;
  private channel: ConfirmChannel | null = null;

  private async getChannel(): Promise<ConfirmChannel> {
    if (this.channel) {
      return this.channel;
    }

    const connection = await amqp.connect(Environment.rabbitMqUrl, {
      timeout: 5000,
    });
    let channel: ConfirmChannel | null = null;
    let connectionClosed = false;
    let channelClosed = false;

    connection.on("error", (error) => {
      console.error("RabbitMQ publisher connection error.", error);
    });
    connection.on("close", () => {
      connectionClosed = true;

      if (this.connection === connection) {
        this.connection = null;
        this.channel = null;
      }
    });

    try {
      channel = await connection.createConfirmChannel();
      const activeChannel = channel;

      activeChannel.on("error", (error) => {
        console.error("RabbitMQ publisher channel error.", error);
      });
      activeChannel.on("close", () => {
        channelClosed = true;

        if (this.channel === activeChannel) {
          this.channel = null;

          if (this.connection === connection) {
            this.connection = null;
          }

          void connection.close().catch(() => undefined);
        }
      });

      await activeChannel.assertExchange(
        Environment.taskEventsExchange,
        "topic",
        { durable: true }
      );

      if (connectionClosed || channelClosed) {
        throw new Error("RabbitMQ publisher closed during setup.");
      }

      this.connection = connection;
      this.channel = activeChannel;

      return activeChannel;
    } catch (error) {
      if (channel) {
        await channel.close().catch(() => undefined);
      }

      await connection.close().catch(() => undefined);
      throw error;
    }
  }

  async publish(event: TaskEvent): Promise<void> {
    try {
      const channel = await this.getChannel();
      let wasReturned = false;
      const handleReturn = (message: { properties: { messageId?: string } }) => {
        if (message.properties.messageId === event.eventId) {
          wasReturned = true;
        }
      };

      channel.on("return", handleReturn);

      try {
        channel.publish(
          Environment.taskEventsExchange,
          event.eventType,
          Buffer.from(JSON.stringify(event)),
          {
            contentType: "application/json",
            contentEncoding: "utf-8",
            mandatory: true,
            persistent: true,
            messageId: event.eventId,
            timestamp: Math.floor(Date.parse(event.occurredAt) / 1000),
            type: event.eventType,
          }
        );
        await channel.waitForConfirms();

        if (wasReturned) {
          throw new Error("No RabbitMQ queue is bound for the task event.");
        }
      } finally {
        channel.removeListener("return", handleReturn);
      }
    } catch (error) {
      await this.reset();
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.reset();
  }

  private async reset(): Promise<void> {
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
}

export default RabbitMqPublisher;
