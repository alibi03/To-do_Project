import type { ConfirmChannel, ConsumeMessage } from "amqplib";
import { inject, injectable } from "inversify";

import type { NotificationConfig } from "../config/NotificationConfig";
import type { TaskEvent } from "../contracts/events/TaskEvents";
import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import type { RetryPublisherPort } from "../ports/InfrastructurePorts";

@injectable()
class RabbitMqRetryPublisher implements RetryPublisherPort {
  private readonly retryExchange: string;

  constructor(
    @inject(ServiceIdentifiers.Config)
    config: NotificationConfig
  ) {
    this.retryExchange = `${config.rabbitMq.queue}.retry-exchange`;
  }

  async publish(
    channel: ConfirmChannel,
    message: ConsumeMessage,
    event: TaskEvent,
    retryCount: number
  ): Promise<void> {
    channel.publish(this.retryExchange, event.eventType, message.content, {
      persistent: true,
      contentType: "application/json",
      contentEncoding: "utf-8",
      messageId: event.eventId,
      type: event.eventType,
      timestamp: Math.floor(Date.now() / 1_000),
      headers: {
        "x-retry-count": retryCount,
      },
    });
    await channel.waitForConfirms();
  }
}

export default RabbitMqRetryPublisher;
