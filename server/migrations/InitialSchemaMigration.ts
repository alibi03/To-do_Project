import type { PoolClient } from "pg";

import type Migration from "./Migration";

class InitialSchemaMigration implements Migration {
  readonly name = "001_initial_schema";

  async up(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'member'
          CHECK (role IN ('admin', 'member')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS todos (
        id UUID PRIMARY KEY,
        created_by_user_id INTEGER NOT NULL
          REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        due_date DATE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
        assigned_to_user_id INTEGER NOT NULL
          REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (status IN ('pending', 'in_progress', 'completed'))
      );

      CREATE INDEX IF NOT EXISTS todos_created_by_user_id_index
        ON todos(created_by_user_id);
      CREATE INDEX IF NOT EXISTS todos_assigned_to_user_id_index
        ON todos(assigned_to_user_id);

      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        code_hash TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS password_reset_codes_user_id_index
        ON password_reset_codes(user_id);
    `);
  }
}

export default InitialSchemaMigration;
