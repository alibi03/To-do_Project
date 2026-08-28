import { inject, injectable } from "inversify";
import type { Pool } from "pg";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import type PasswordResetCode from "../models/domain/PasswordResetCode";
import { PersistenceError } from "../errors/ApplicationErrors";
import {
  PasswordResetCodeMapper,
  type PasswordResetCodeDatabaseRecord,
} from "../mappers/PasswordResetCodeMapper";
import type {
  ConsumePasswordResetModel,
  CreatePasswordResetModel,
} from "../models/repositories/PasswordResetModels";
import type { PasswordResetRepositoryPort } from "../ports/RepositoryPorts";

@injectable()
export class PasswordResetRepository implements PasswordResetRepositoryPort {
  constructor(
    @inject(DependencySymbols.Pool) private readonly pool: Pool
  ) {}

  async replaceActiveForUser(
    model: CreatePasswordResetModel
  ): Promise<PasswordResetCode> {
    const { userId, codeHash, expiresAt } = model;
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");
      await client.query("SELECT pg_advisory_xact_lock($1)", [userId]);
      await client.query(
        `UPDATE password_reset_codes
         SET used_at = CURRENT_TIMESTAMP
         WHERE user_id = $1 AND used_at IS NULL`,
        [userId]
      );

      const result = await client.query<PasswordResetCodeDatabaseRecord>(
        `INSERT INTO password_reset_codes (user_id, code_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, code_hash, expires_at, used_at, created_at`,
        [userId, codeHash, expiresAt]
      );
      const row = result.rows[0];

      if (!row) {
        throw new PersistenceError(
          "Created password reset code could not be reloaded."
        );
      }

      await client.query("COMMIT");
      return PasswordResetCodeMapper.fromDatabase(row);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async findLatestActiveForUser(
    userId: number
  ): Promise<PasswordResetCode | null> {
    const result = await this.pool.query<PasswordResetCodeDatabaseRecord>(
      `SELECT id, user_id, code_hash, expires_at, used_at, created_at
       FROM password_reset_codes
       WHERE user_id = $1
         AND used_at IS NULL
         AND expires_at > CURRENT_TIMESTAMP
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    return result.rows[0]
      ? PasswordResetCodeMapper.fromDatabase(result.rows[0])
      : null;
  }

  async consumeAndUpdatePassword(
    model: ConsumePasswordResetModel
  ): Promise<boolean> {
    const { resetCodeId, userId, passwordHash } = model;
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const consumeResult = await client.query<{ id: number }>(
        `UPDATE password_reset_codes
         SET used_at = CURRENT_TIMESTAMP
         WHERE id = $1
           AND user_id = $2
           AND used_at IS NULL
           AND expires_at > CURRENT_TIMESTAMP
         RETURNING id`,
        [resetCodeId, userId]
      );

      if (!consumeResult.rows[0]) {
        await client.query("ROLLBACK");
        return false;
      }

      await client.query(
        `UPDATE users
         SET password_hash = $1
         WHERE id = $2`,
        [passwordHash, userId]
      );

      await client.query("COMMIT");
      return true;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}

export default PasswordResetRepository;
