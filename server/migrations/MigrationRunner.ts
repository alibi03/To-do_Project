import pool from "../config/database";
import InitialSchemaMigration from "./InitialSchemaMigration";
import type Migration from "./Migration";
import UuidTodoOutboxMigration from "./UuidTodoOutboxMigration";

class MigrationRunner {
  private readonly migrations: Migration[] = [
    new InitialSchemaMigration(),
    new UuidTodoOutboxMigration(),
  ];

  async run(): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query("SELECT pg_advisory_lock(hashtext('staj_app_migrations'))");
      await client.query(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          name VARCHAR(150) PRIMARY KEY,
          applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      for (const migration of this.migrations) {
        const applied = await client.query<{ exists: boolean }>(
          "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE name = $1)",
          [migration.name]
        );

        if (applied.rows[0]?.exists) {
          continue;
        }

        await client.query("BEGIN");

        try {
          await migration.up(client);
          await client.query(
            "INSERT INTO schema_migrations (name) VALUES ($1)",
            [migration.name]
          );
          await client.query("COMMIT");
          console.log(`Applied database migration ${migration.name}.`);
        } catch (error) {
          await client.query("ROLLBACK");
          throw error;
        }
      }
    } finally {
      await client
        .query("SELECT pg_advisory_unlock(hashtext('staj_app_migrations'))")
        .catch(() => undefined);
      client.release();
    }
  }
}

const migrationRunner = new MigrationRunner();

export default migrationRunner;
