import "reflect-metadata";

import { Container } from "inversify";
import type { Pool } from "pg";

import ApplicationFactory from "../app";
import TodoServer from "../bootstrap/TodoServer";
import type { ApplicationConfig } from "../config/ApplicationConfig";
import DatabasePoolFactory from "../config/DatabasePoolFactory";
import Environment from "../config/Environment";
import AuthController from "../controllers/AuthController";
import HealthController from "../controllers/HealthController";
import PasswordResetController from "../controllers/PasswordResetController";
import ProfileController from "../controllers/ProfileController";
import TodoController from "../controllers/TodoController";
import UserController from "../controllers/UserController";
import TaskEventFactory from "../factories/TaskEventFactory";
import RabbitMqPublisher from "../messaging/RabbitMqPublisher";
import AuthenticateToken from "../middleware/AuthenticateToken";
import ErrorMiddleware from "../middleware/ErrorMiddleware";
import InitialSchemaMigration from "../migrations/InitialSchemaMigration";
import MigrationRunner from "../migrations/MigrationRunner";
import UuidTodoOutboxMigration from "../migrations/UuidTodoOutboxMigration";
import type {
  ApplicationFactoryPort,
  MigrationRunnerPort,
  RateLimiterPort,
  TaskEventFactoryPort,
  TaskEventPublisherPort,
  TodoServerPort,
  UuidGeneratorPort,
} from "../ports/InfrastructurePorts";
import type {
  OutboxRepositoryPort,
  PasswordResetRepositoryPort,
  SystemRepositoryPort,
  TodoRepositoryPort,
  UserRepositoryPort,
} from "../ports/RepositoryPorts";
import type {
  AuthServicePort,
  AuthorizationServicePort,
  HealthServicePort,
  OutboxPublisherServicePort,
  TodoServicePort,
  TokenServicePort,
  UserServicePort,
} from "../ports/ServicePorts";
import OutboxRepository from "../repositories/OutboxRepository";
import PasswordResetRepository from "../repositories/PasswordResetRepository";
import SystemRepository from "../repositories/SystemRepository";
import TodoRepository from "../repositories/TodoRepository";
import UserRepository from "../repositories/UserRepository";
import AuthRouter from "../routes/AuthRouter";
import ProfileRouter from "../routes/ProfileRouter";
import TodoRouter from "../routes/TodoRouter";
import UserRouter from "../routes/UserRouter";
import AuthService from "../services/AuthService";
import AuthorizationService from "../services/AuthorizationService";
import HealthService from "../services/HealthService";
import OutboxPublisherService from "../services/OutboxPublisherService";
import TodoService from "../services/TodoService";
import TokenService from "../services/TokenService";
import UserService from "../services/UserService";
import RateLimiters from "../utils/RateLimiters";
import UuidGenerator from "../utils/UuidGenerator";
import DependencySymbols from "./DependencySymbols";

function readConfig(): ApplicationConfig {
  Environment.validate();

  return {
    port: Environment.port,
    clientOrigin: Environment.clientOrigin,
    database: {
      host: Environment.databaseHost,
      port: Environment.databasePort,
      name: Environment.databaseName,
      user: Environment.databaseUser,
      password: Environment.databasePassword,
    },
    jwt: {
      secret: Environment.jwtSecret,
      expiresIn: Environment.jwtExpiresIn,
      exposePasswordResetCode: Environment.exposesPasswordResetCode,
    },
    rabbitMq: {
      url: Environment.rabbitMqUrl,
      taskEventsExchange: Environment.taskEventsExchange,
    },
    outbox: {
      pollIntervalMilliseconds: Environment.outboxPollIntervalMilliseconds,
      batchSize: Environment.outboxBatchSize,
    },
  };
}

function createContainer(): Container {
  const container = new Container();
  const config = readConfig();
  const pool = DatabasePoolFactory.create(config.database);

  container
    .bind<ApplicationConfig>(DependencySymbols.ApplicationConfig)
    .toConstantValue(config);
  container.bind<Pool>(DependencySymbols.Pool).toConstantValue(pool);

  container
    .bind<OutboxRepositoryPort>(DependencySymbols.OutboxRepository)
    .to(OutboxRepository)
    .inSingletonScope();
  container
    .bind<PasswordResetRepositoryPort>(
      DependencySymbols.PasswordResetRepository
    )
    .to(PasswordResetRepository)
    .inSingletonScope();
  container
    .bind<SystemRepositoryPort>(DependencySymbols.SystemRepository)
    .to(SystemRepository)
    .inSingletonScope();
  container
    .bind<TodoRepositoryPort>(DependencySymbols.TodoRepository)
    .to(TodoRepository)
    .inSingletonScope();
  container
    .bind<UserRepositoryPort>(DependencySymbols.UserRepository)
    .to(UserRepository)
    .inSingletonScope();

  container
    .bind<AuthServicePort>(DependencySymbols.AuthService)
    .to(AuthService)
    .inSingletonScope();
  container
    .bind<AuthorizationServicePort>(DependencySymbols.AuthorizationService)
    .to(AuthorizationService)
    .inSingletonScope();
  container
    .bind<HealthServicePort>(DependencySymbols.HealthService)
    .to(HealthService)
    .inSingletonScope();
  container
    .bind<OutboxPublisherServicePort>(
      DependencySymbols.OutboxPublisherService
    )
    .to(OutboxPublisherService)
    .inSingletonScope();
  container
    .bind<TodoServicePort>(DependencySymbols.TodoService)
    .to(TodoService)
    .inSingletonScope();
  container
    .bind<TokenServicePort>(DependencySymbols.TokenService)
    .to(TokenService)
    .inSingletonScope();
  container
    .bind<UserServicePort>(DependencySymbols.UserService)
    .to(UserService)
    .inSingletonScope();

  container
    .bind<UuidGeneratorPort>(DependencySymbols.UuidGenerator)
    .to(UuidGenerator)
    .inSingletonScope();
  container
    .bind<RateLimiterPort>(DependencySymbols.RateLimiters)
    .to(RateLimiters)
    .inSingletonScope();
  container
    .bind<TaskEventFactoryPort>(DependencySymbols.TaskEventFactory)
    .to(TaskEventFactory)
    .inSingletonScope();
  container
    .bind<TaskEventPublisherPort>(DependencySymbols.TaskEventPublisher)
    .to(RabbitMqPublisher)
    .inSingletonScope();

  container.bind(InitialSchemaMigration).toSelf().inSingletonScope();
  container.bind(UuidTodoOutboxMigration).toSelf().inSingletonScope();
  container
    .bind<MigrationRunnerPort>(DependencySymbols.MigrationRunner)
    .to(MigrationRunner)
    .inSingletonScope();

  container
    .bind<AuthController>(DependencySymbols.AuthController)
    .to(AuthController)
    .inSingletonScope();
  container
    .bind<HealthController>(DependencySymbols.HealthController)
    .to(HealthController)
    .inSingletonScope();
  container
    .bind<PasswordResetController>(
      DependencySymbols.PasswordResetController
    )
    .to(PasswordResetController)
    .inSingletonScope();
  container
    .bind<ProfileController>(DependencySymbols.ProfileController)
    .to(ProfileController)
    .inSingletonScope();
  container
    .bind<TodoController>(DependencySymbols.TodoController)
    .to(TodoController)
    .inSingletonScope();
  container
    .bind<UserController>(DependencySymbols.UserController)
    .to(UserController)
    .inSingletonScope();
  container
    .bind<AuthenticateToken>(DependencySymbols.AuthenticateToken)
    .to(AuthenticateToken)
    .inSingletonScope();
  container
    .bind<ErrorMiddleware>(DependencySymbols.ErrorMiddleware)
    .to(ErrorMiddleware)
    .inSingletonScope();
  container
    .bind<AuthRouter>(DependencySymbols.AuthRouter)
    .to(AuthRouter)
    .inSingletonScope();
  container
    .bind<ProfileRouter>(DependencySymbols.ProfileRouter)
    .to(ProfileRouter)
    .inSingletonScope();
  container
    .bind<TodoRouter>(DependencySymbols.TodoRouter)
    .to(TodoRouter)
    .inSingletonScope();
  container
    .bind<UserRouter>(DependencySymbols.UserRouter)
    .to(UserRouter)
    .inSingletonScope();
  container
    .bind<ApplicationFactoryPort>(DependencySymbols.Application)
    .to(ApplicationFactory)
    .inSingletonScope();
  container
    .bind<TodoServerPort>(DependencySymbols.TodoServer)
    .to(TodoServer)
    .inSingletonScope();

  return container;
}

export { readConfig };
export default createContainer;
