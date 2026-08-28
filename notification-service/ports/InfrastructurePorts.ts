import type {
  ConfirmChannel,
  ConsumeMessage,
  ChannelModel,
  MessageProperties,
} from "amqplib";
import type {
  ErrorRequestHandler,
  Express,
  NextFunction,
  Request,
  RequestHandler,
  Response,
  Router,
} from "express";

import type { TaskEvent } from "../contracts/events/TaskEvents";
import type HealthResponse from "../models/responses/HealthResponse";
import type { NotificationListResponse } from "../models/responses/NotificationResponse";

interface ApplicationFactoryPort {
  create(): Express;
}

interface AuthenticationMiddlewarePort {
  readonly handle: RequestHandler;
}

interface DatabasePort {
  close(): Promise<void>;
}

interface ErrorMiddlewarePort {
  readonly notFound: RequestHandler;
  readonly handle: ErrorRequestHandler;
}

interface HealthControllerPort {
  getStatus(
    request: Request,
    response: Response<HealthResponse>,
    next: NextFunction
  ): Promise<Response<HealthResponse>>;
}

interface IdGeneratorPort {
  generate(): string;
}

interface MigrationRunnerPort {
  run(): Promise<void>;
}

interface NotificationControllerPort {
  list(
    request: Request,
    response: Response<NotificationListResponse>,
    next: NextFunction
  ): Promise<Response<NotificationListResponse>>;
}

interface NotificationLimitParserPort {
  parse(value: unknown): number;
}

interface NotificationRouterPort {
  create(): Router;
}

interface NotificationServerPort {
  start(): Promise<void>;
}

interface RabbitMqConnectionFactoryPort {
  connect(): Promise<ChannelModel>;
}

interface RetryPublisherPort {
  publish(
    channel: ConfirmChannel,
    message: ConsumeMessage,
    event: TaskEvent,
    retryCount: number
  ): Promise<void>;
}

interface TaskEventConsumerPort {
  start(): void;
  close(): Promise<void>;
}

interface TaskEventParserPort {
  parse(
    content: Buffer,
    routingKey: string,
    properties: MessageProperties
  ): TaskEvent;
}

export type {
  ApplicationFactoryPort,
  AuthenticationMiddlewarePort,
  DatabasePort,
  ErrorMiddlewarePort,
  HealthControllerPort,
  IdGeneratorPort,
  MigrationRunnerPort,
  NotificationControllerPort,
  NotificationLimitParserPort,
  NotificationRouterPort,
  NotificationServerPort,
  RabbitMqConnectionFactoryPort,
  RetryPublisherPort,
  TaskEventConsumerPort,
  TaskEventParserPort,
};
