import "reflect-metadata";

import { Container } from "inversify";
import { Pool } from "pg";

import ApplicationFactory from "../app";
import NotificationServer from "../bootstrap/NotificationServer";
import Database from "../config/Database";
import Environment from "../config/Environment";
import type { NotificationConfig } from "../config/NotificationConfig";
import HealthController from "../controllers/HealthController";
import NotificationController from "../controllers/NotificationController";
import MigrationRunner from "../database/MigrationRunner";
import RabbitMqConnectionFactory from "../messaging/RabbitMqConnectionFactory";
import RabbitMqRetryPublisher from "../messaging/RabbitMqRetryPublisher";
import RabbitMqTaskEventConsumer from "../messaging/RabbitMqTaskEventConsumer";
import AuthenticateToken from "../middleware/AuthenticateToken";
import ErrorMiddleware from "../middleware/ErrorMiddleware";
import NotificationLimitParser from "../parsers/NotificationLimitParser";
import TaskEventParser from "../parsers/TaskEventParser";
import type {
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
} from "../ports/InfrastructurePorts";
import type { NotificationRepositoryPort } from "../ports/RepositoryPorts";
import type {
  NotificationServicePort,
  TokenServicePort,
} from "../ports/ServicePorts";
import NotificationRepository from "../repositories/NotificationRepository";
import NotificationRouter from "../routes/NotificationRouter";
import NotificationService from "../services/NotificationService";
import TokenService from "../services/TokenService";
import UuidGenerator from "../utils/UuidGenerator";
import ServiceIdentifiers from "./ServiceIdentifiers";

function readConfig(): NotificationConfig {
  Environment.validate();

  return {
    port: Environment.port,
    clientOrigin: Environment.clientOrigin,
    jwtSecret: Environment.jwtSecret,
    database: {
      host: Environment.databaseHost,
      port: Environment.databasePort,
      name: Environment.databaseName,
      user: Environment.databaseUser,
      password: Environment.databasePassword,
    },
    rabbitMq: {
      url: Environment.rabbitMqUrl,
      exchange: Environment.rabbitMqExchange,
      queue: Environment.rabbitMqQueue,
      prefetch: Environment.rabbitMqPrefetch,
      maxRetries: Environment.rabbitMqMaxRetries,
      retryDelayMilliseconds: Environment.rabbitMqRetryDelayMs,
    },
  };
}

function createContainer(): Container {
  const container = new Container();
  const config = readConfig();
  const pool = new Pool({
    host: config.database.host,
    port: config.database.port,
    database: config.database.name,
    user: config.database.user,
    password: config.database.password,
  });

  pool.on("error", (error) => {
    console.error("Unexpected notification database pool error.", error);
  });

  container
    .bind<NotificationConfig>(ServiceIdentifiers.Config)
    .toConstantValue(config);
  container.bind<Pool>(ServiceIdentifiers.DatabasePool).toConstantValue(pool);
  container
    .bind<DatabasePort>(ServiceIdentifiers.Database)
    .to(Database)
    .inSingletonScope();
  container
    .bind<ErrorMiddlewarePort>(ServiceIdentifiers.ErrorMiddleware)
    .to(ErrorMiddleware)
    .inSingletonScope();
  container
    .bind<HealthControllerPort>(ServiceIdentifiers.HealthController)
    .to(HealthController)
    .inSingletonScope();
  container
    .bind<MigrationRunnerPort>(ServiceIdentifiers.MigrationRunner)
    .to(MigrationRunner)
    .inSingletonScope();
  container
    .bind<IdGeneratorPort>(ServiceIdentifiers.IdGenerator)
    .to(UuidGenerator)
    .inSingletonScope();
  container
    .bind<NotificationRepositoryPort>(ServiceIdentifiers.NotificationRepository)
    .to(NotificationRepository)
    .inSingletonScope();
  container
    .bind<NotificationServicePort>(ServiceIdentifiers.NotificationService)
    .to(NotificationService)
    .inSingletonScope();
  container
    .bind<TokenServicePort>(ServiceIdentifiers.TokenService)
    .to(TokenService)
    .inSingletonScope();
  container
    .bind<NotificationLimitParserPort>(
      ServiceIdentifiers.NotificationLimitParser
    )
    .to(NotificationLimitParser)
    .inSingletonScope();
  container
    .bind<TaskEventParserPort>(ServiceIdentifiers.TaskEventParser)
    .to(TaskEventParser)
    .inSingletonScope();
  container
    .bind<RabbitMqConnectionFactoryPort>(
      ServiceIdentifiers.RabbitMqConnectionFactory
    )
    .to(RabbitMqConnectionFactory)
    .inSingletonScope();
  container
    .bind<RetryPublisherPort>(ServiceIdentifiers.RetryPublisher)
    .to(RabbitMqRetryPublisher)
    .inSingletonScope();
  container
    .bind<TaskEventConsumerPort>(ServiceIdentifiers.TaskEventConsumer)
    .to(RabbitMqTaskEventConsumer)
    .inSingletonScope();
  container
    .bind<AuthenticationMiddlewarePort>(
      ServiceIdentifiers.AuthenticationMiddleware
    )
    .to(AuthenticateToken)
    .inSingletonScope();
  container
    .bind<NotificationControllerPort>(
      ServiceIdentifiers.NotificationController
    )
    .to(NotificationController)
    .inSingletonScope();
  container
    .bind<NotificationRouterPort>(ServiceIdentifiers.NotificationRouter)
    .to(NotificationRouter)
    .inSingletonScope();
  container
    .bind<ApplicationFactoryPort>(ServiceIdentifiers.ApplicationFactory)
    .to(ApplicationFactory)
    .inSingletonScope();
  container
    .bind<NotificationServerPort>(ServiceIdentifiers.NotificationServer)
    .to(NotificationServer)
    .inSingletonScope();

  return container;
}

export { readConfig };
export default createContainer;
