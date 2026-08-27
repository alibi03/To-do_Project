import "dotenv/config";

import pool from "../config/database";
import migrationRunner from "./MigrationRunner";

async function run(): Promise<void> {
  try {
    await migrationRunner.run();
  } finally {
    await pool.end();
  }
}

void run().catch((error: Error) => {
  console.error("Database migration failed.", error);
  process.exitCode = 1;
});
