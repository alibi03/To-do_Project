import "dotenv/config";

import type { Server } from "node:http";

import app from "./app";
import Environment from "./config/Environment";
import pool from "./config/database";
import migrationRunner from "./migrations/MigrationRunner";
import outboxPublisherService from "./services/OutboxPublisherService";

const port = Environment.port;
let server: Server | null = null;
let shuttingDown = false;

async function start(): Promise<void> {
  await migrationRunner.run();

  server = await new Promise<Server>((resolve, reject) => {
    const httpServer = app.listen(port);

    httpServer.once("listening", () => resolve(httpServer));
    httpServer.once("error", reject);
  });
  outboxPublisherService.start();
  console.log(`Server running at http://localhost:${port}`);
}

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  console.log(`${signal} received. Shutting down.`);

  const results = await Promise.allSettled([
    closeHttpServer(),
    outboxPublisherService.stop(),
    pool.end(),
  ]);
  const failure = results.find(
    (result): result is PromiseRejectedResult => result.status === "rejected"
  );

  if (failure) {
    throw failure.reason;
  }
}

async function closeHttpServer(): Promise<void> {
  if (!server) {
    return;
  }

  const activeServer = server;
  server = null;

  await new Promise<void>((resolve, reject) => {
    activeServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function handleShutdown(signal: NodeJS.Signals): void {
  void shutdown(signal).catch((error: Error) => {
    console.error("Server shutdown failed.", error);
    process.exitCode = 1;
  });
}

process.once("SIGINT", () => handleShutdown("SIGINT"));
process.once("SIGTERM", () => handleShutdown("SIGTERM"));

void start().catch(async (error: Error) => {
  console.error("Server startup failed.", error);
  process.exitCode = 1;

  await Promise.allSettled([
    closeHttpServer(),
    outboxPublisherService.stop(),
    pool.end(),
  ]);
});
