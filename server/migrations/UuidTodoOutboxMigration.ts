import { inject, injectable } from "inversify";
import type { PoolClient } from "pg";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import { PersistenceError } from "../errors/ApplicationErrors";
import type { UuidGeneratorPort } from "../ports/InfrastructurePorts";
import type Migration from "./Migration";

type TodoIdColumnRecord = {
  data_type: string;
};

type LegacyTodoIdRecord = {
  id: number;
};

type ReferencingConstraintRecord = {
  constraint_name: string;
};

@injectable()
class UuidTodoOutboxMigration implements Migration {
  readonly name = "002_uuidv7_todo_ids_and_outbox";

  constructor(
    @inject(DependencySymbols.UuidGenerator)
    private readonly uuidGenerator: UuidGeneratorPort
  ) {}

  async up(client: PoolClient): Promise<void> {
    await this.migrateTodoIds(client);
    await this.createOutbox(client);
  }

  private async migrateTodoIds(client: PoolClient): Promise<void> {
    const columnResult = await client.query<TodoIdColumnRecord>(
      `SELECT data_type
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = 'todos'
         AND column_name = 'id'`
    );
    const idColumn = columnResult.rows[0];

    if (!idColumn) {
      throw new PersistenceError("The todos.id column was not found.");
    }

    if (idColumn.data_type === "uuid") {
      return;
    }

    if (idColumn.data_type !== "integer") {
      throw new PersistenceError(
        `Cannot migrate todos.id from unsupported type ${idColumn.data_type}.`
      );
    }

    const references = await client.query<ReferencingConstraintRecord>(
      `SELECT constraint_name
       FROM information_schema.constraint_column_usage
       WHERE table_schema = 'public'
         AND table_name = 'todos'
         AND column_name = 'id'
         AND constraint_name <> 'todos_pkey'`
    );

    if (references.rows.length > 0) {
      throw new PersistenceError(
        "Cannot migrate todos.id while another table references it."
      );
    }

    await client.query("ALTER TABLE todos ADD COLUMN id_v7 UUID");
    const legacyTodos = await client.query<LegacyTodoIdRecord>(
      "SELECT id FROM todos ORDER BY id FOR UPDATE"
    );

    for (const todo of legacyTodos.rows) {
      await client.query("UPDATE todos SET id_v7 = $1 WHERE id = $2", [
        this.uuidGenerator.generateV7(),
        todo.id,
      ]);
    }

    await client.query(`
      ALTER TABLE todos DROP CONSTRAINT todos_pkey;
      ALTER TABLE todos DROP COLUMN id;
      ALTER TABLE todos RENAME COLUMN id_v7 TO id;
      ALTER TABLE todos ALTER COLUMN id SET NOT NULL;
      ALTER TABLE todos ADD CONSTRAINT todos_pkey PRIMARY KEY (id);
      DROP SEQUENCE IF EXISTS todos_id_seq;
    `);
  }

  private async createOutbox(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS outbox_events (
        id UUID PRIMARY KEY,
        aggregate_type VARCHAR(50) NOT NULL,
        aggregate_id UUID NOT NULL,
        event_type VARCHAR(50) NOT NULL
          CHECK (event_type IN ('task.created.v1', 'task.assigned.v1')),
        payload JSONB NOT NULL,
        occurred_at TIMESTAMPTZ NOT NULL,
        claimed_at TIMESTAMPTZ,
        published_at TIMESTAMPTZ,
        attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
        last_error TEXT
      );

      CREATE INDEX IF NOT EXISTS outbox_events_pending_index
        ON outbox_events(occurred_at)
        WHERE published_at IS NULL;
    `);
  }
}

export default UuidTodoOutboxMigration;
