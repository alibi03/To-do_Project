import { connect, type ChannelModel } from "amqplib";
import { inject, injectable } from "inversify";

import type { NotificationConfig } from "../config/NotificationConfig";
import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import type { RabbitMqConnectionFactoryPort } from "../ports/InfrastructurePorts";

@injectable()
class RabbitMqConnectionFactory implements RabbitMqConnectionFactoryPort {
  constructor(
    @inject(ServiceIdentifiers.Config)
    private readonly config: NotificationConfig
  ) {}

  async connect(): Promise<ChannelModel> {
    return connect(this.config.rabbitMq.url, { timeout: 5_000 });
  }
}

export default RabbitMqConnectionFactory;
