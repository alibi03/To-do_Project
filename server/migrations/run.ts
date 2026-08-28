import "dotenv/config";
import "reflect-metadata";

import CompositionRoot from "../dependencyInjection/CompositionRoot";

async function run(): Promise<void> {
  const compositionRoot = new CompositionRoot();
  const pool = compositionRoot.resolvePool();

  try {
    await compositionRoot.resolveMigrationRunner().run();
  } finally {
    await pool.end();
  }
}

void run().catch((error: unknown) => {
  console.error("Database migration failed.", error);
  process.exitCode = 1;
});
