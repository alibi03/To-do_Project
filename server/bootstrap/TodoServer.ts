import type { Server } from "node:http";

import type { Express } from "express";
import { inject, injectable } from "inversify";
import type { Pool } from "pg";

import type { ApplicationConfig } from "../config/ApplicationConfig";
import DependencySymbols from "../dependencyInjection/DependencySymbols";
import type {
  ApplicationFactoryPort,
  MigrationRunnerPort,
  TodoServerPort,
} from "../ports/InfrastructurePorts";
import type { OutboxPublisherServicePort } from "../ports/ServicePorts";

@injectable()
class TodoServer implements TodoServerPort {
  private readonly app: Express;
  private httpServer: Server | null = null;
  private shuttingDown = false;

  constructor(
    @inject(DependencySymbols.Application)
    applicationFactory: ApplicationFactoryPort,
    @inject(DependencySymbols.MigrationRunner)
    private readonly migrationRunner: MigrationRunnerPort,
    @inject(DependencySymbols.OutboxPublisherService)
    private readonly outboxPublisherService: OutboxPublisherServicePort,
    @inject(DependencySymbols.Pool)
    private readonly pool: Pool,
    @inject(DependencySymbols.ApplicationConfig)
    private readonly config: ApplicationConfig
  ) {
    this.app = applicationFactory.create();
  }

  async start(): Promise<void> {
    try {
      await this.migrationRunner.run();
      await this.listen();
      this.registerSignalHandlers();
      this.outboxPublisherService.start();
      console.log(`Server running at http://localhost:${this.config.port}`);
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
    console.log(`${signal} received. Shutting down.`);

    void this.shutdown().catch((error: unknown) => {
      console.error("Server shutdown failed.", error);
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
      this.outboxPublisherService.stop(),
      this.pool.end(),
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

export default TodoServer;
