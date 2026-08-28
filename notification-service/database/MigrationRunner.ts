import type { Pool, PoolClient, QueryResultRow } from "pg";
import { inject, injectable } from "inversify";

import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import type { MigrationRunnerPort } from "../ports/InfrastructurePorts";

class Migration {
  constructor(
    readonly version: number,
    readonly name: string,
    readonly sql: string
  ) {}
}

interface MigrationVersionRow extends QueryResultRow {
  version: number;
}

@injectable()
class MigrationRunner implements MigrationRunnerPort {
  private static readonly advisoryLockId = 7_240_831_001;

  private readonly migrations: readonly Migration[] = [
    new Migration(
      1,
      "create_notifications",
      `
        CREATE TABLE notifications (
          id uuid PRIMARY KEY,
          event_id uuid NOT NULL UNIQUE,
          event_type varchar(40) NOT NULL
            CHECK (event_type IN ('task.created.v1', 'task.assigned.v1')),
          recipient_user_id integer,
          task_id uuid NOT NULL,
          message text NOT NULL,
          created_at timestamptz NOT NULL,
          read_at timestamptz,
          CONSTRAINT notifications_recipient_matches_event_check CHECK (
            (event_type = 'task.created.v1' AND recipient_user_id IS NULL)
            OR
            (event_type = 'task.assigned.v1' AND recipient_user_id IS NOT NULL)
          )
        );

        CREATE INDEX notifications_recipient_created_at_idx
          ON notifications (recipient_user_id, created_at DESC, id DESC)
          WHERE recipient_user_id IS NOT NULL;
      `
    ),
  ];

  constructor(
    @inject(ServiceIdentifiers.DatabasePool)
    private readonly pool: Pool
  ) {}

  async run(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [
        MigrationRunner.advisoryLockId,
      ]);
      await this.createMigrationTable(client);

      const result = await client.query<MigrationVersionRow>(
        "SELECT version FROM schema_migrations"
      );
      const appliedVersions = new Set(result.rows.map((row) => row.version));

      for (const migration of this.migrations) {
        if (!appliedVersions.has(migration.version)) {
          await client.query(migration.sql);
          await client.query(
            `INSERT INTO schema_migrations (version, name)
             VALUES ($1, $2)`,
            [migration.version, migration.name]
          );
        }
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  private async createMigrationTable(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version integer PRIMARY KEY,
        name varchar(100) NOT NULL UNIQUE,
        applied_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
}

export default MigrationRunner;
