import type { Server } from "node:http";

import type { Express } from "express";
import { inject, injectable } from "inversify";

import type { NotificationConfig } from "../config/NotificationConfig";
import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import type {
  ApplicationFactoryPort,
  DatabasePort,
  MigrationRunnerPort,
  NotificationServerPort,
  TaskEventConsumerPort,
} from "../ports/InfrastructurePorts";

@injectable()
class NotificationServer implements NotificationServerPort {
  private readonly app: Express;
  private httpServer: Server | null = null;
  private shuttingDown = false;

  constructor(
    @inject(ServiceIdentifiers.Database)
    private readonly database: DatabasePort,
    @inject(ServiceIdentifiers.MigrationRunner)
    private readonly migrationRunner: MigrationRunnerPort,
    @inject(ServiceIdentifiers.ApplicationFactory)
    applicationFactory: ApplicationFactoryPort,
    @inject(ServiceIdentifiers.TaskEventConsumer)
    private readonly consumer: TaskEventConsumerPort,
    @inject(ServiceIdentifiers.Config)
    private readonly config: NotificationConfig
  ) {
    this.app = applicationFactory.create();
  }

  async start(): Promise<void> {
    try {
      await this.migrationRunner.run();
      await this.listen();
      this.registerSignalHandlers();
      this.consumer.start();

      console.log(
        `Notification Service running at http://localhost:${this.config.port}`
      );
    } catch (error) {
      await this.shutdown();
      throw error;
    }
  }

  private async listen(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const server = this.app.listen(this.config.port);
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

export default NotificationServer;
