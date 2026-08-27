import type { Server } from "node:http";

import ApplicationFactory from "./app";
import Database from "./config/Database";
import Environment from "./config/Environment";
import NotificationController from "./controllers/NotificationController";
import MigrationRunner from "./database/MigrationRunner";
import RabbitMqTaskEventConsumer from "./messaging/RabbitMqTaskEventConsumer";
import AuthenticateToken from "./middleware/AuthenticateToken";
import NotificationLimitParser from "./parsers/NotificationLimitParser";
import TaskEventParser from "./parsers/TaskEventParser";
import NotificationRepository from "./repositories/NotificationRepository";
import NotificationService from "./services/NotificationService";
import TokenService from "./services/TokenService";

class NotificationServer {
  private readonly database: Database;
  private readonly consumer: RabbitMqTaskEventConsumer;
  private readonly app: ReturnType<typeof ApplicationFactory.create>;
  private httpServer: Server | null = null;
  private shuttingDown = false;

  constructor() {
    Environment.validate();

    this.database = new Database();
    const repository = new NotificationRepository(this.database.pool);
    const notificationService = new NotificationService(repository);
    const controller = new NotificationController(
      notificationService,
      new NotificationLimitParser()
    );
    const authenticateToken = new AuthenticateToken(new TokenService());

    this.consumer = new RabbitMqTaskEventConsumer(
      new TaskEventParser(),
      notificationService
    );
    this.app = ApplicationFactory.create(authenticateToken, controller);
  }

  async start(): Promise<void> {
    try {
      await new MigrationRunner(this.database.pool).run();
      await this.listen();
      this.registerSignalHandlers();
      this.consumer.start();

      console.log(
        `Notification Service running at http://localhost:${Environment.port}`
      );
    } catch (error) {
      await this.shutdown();
      throw error;
    }
  }

  private async listen(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const server = this.app.listen(Environment.port);
      this.httpServer = server;
      server.once("listening", resolve);
      server.once("error", (error) => {
        if (this.httpServer === server) {
          this.httpServer = null;
        }

        reject(error);
      });
    });
  }

  private registerSignalHandlers(): void {
    process.once("SIGINT", () => this.handleSignal("SIGINT"));
    process.once("SIGTERM", () => this.handleSignal("SIGTERM"));
  }

  private handleSignal(signal: NodeJS.Signals): void {
    console.log(`${signal} received. Shutting down Notification Service.`);

    void this.shutdown().catch((error: unknown) => {
      console.error("Notification Service shutdown failed.", error);
      process.exitCode = 1;
    });
  }

  private async shutdown(): Promise<void> {
    if (this.shuttingDown) {
      return;
    }

    this.shuttingDown = true;

    const results = await Promise.allSettled([
      this.closeHttpServer(),
      this.consumer.close(),
      this.database.close(),
    ]);
    const failure = results.find(
      (result): result is PromiseRejectedResult => result.status === "rejected"
    );

    if (failure) {
      throw failure.reason;
    }
  }

  private async closeHttpServer(): Promise<void> {
    if (!this.httpServer) {
      return;
    }

    const server = this.httpServer;
    this.httpServer = null;

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}

async function main(): Promise<void> {
  const server = new NotificationServer();
  await server.start();
}

void main().catch((error: unknown) => {
  console.error("Notification Service failed to start.", error);
  process.exitCode = 1;
});
