import "dotenv/config";

import app from "./app";
import Environment from "./config/Environment";
import pool from "./config/database";

const port = Environment.port;

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  console.log(`${signal} received. Shutting down.`);

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  await pool.end();
}

function handleShutdown(signal: NodeJS.Signals): void {
  void shutdown(signal).catch((error: Error) => {
    console.error("Server shutdown failed.", error);
    process.exitCode = 1;
  });
}

process.once("SIGINT", () => handleShutdown("SIGINT"));
process.once("SIGTERM", () => handleShutdown("SIGTERM"));
