import { inject, injectable } from "inversify";
import type { Pool } from "pg";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import { PersistenceError } from "../errors/ApplicationErrors";
import { UserMapper, type UserDatabaseRecord } from "../mappers/UserMapper";
import type User from "../models/domain/User";
import type { CreateUserModel } from "../models/repositories/UserModels";
import type { UserRepositoryPort } from "../ports/RepositoryPorts";

@injectable()
export class UserRepository implements UserRepositoryPort {
  constructor(
    @inject(DependencySymbols.Pool) private readonly pool: Pool
  ) {}

  async create(model: CreateUserModel): Promise<User> {
    const { username, email, passwordHash } = model;
    const result = await this.pool.query<UserDatabaseRecord>(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, password_hash, role, created_at`,
      [username, email, passwordHash]
    );

    const row = result.rows[0];

    if (!row) {
      throw new PersistenceError("Created user could not be reloaded.");
    }

    return UserMapper.fromDatabase(row);
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.pool.query<UserDatabaseRecord>(
      `SELECT id, username, email, password_hash, role, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    return result.rows[0] ? UserMapper.fromDatabase(result.rows[0]) : null;
  }

  async findById(userId: number): Promise<User | null> {
    const result = await this.pool.query<UserDatabaseRecord>(
      `SELECT id, username, email, password_hash, role, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    return result.rows[0] ? UserMapper.fromDatabase(result.rows[0]) : null;
  }

  async listForAssignment(): Promise<User[]> {
    const result = await this.pool.query<UserDatabaseRecord>(
      `SELECT id, username, email, password_hash, role, created_at
       FROM users
       ORDER BY username ASC`
    );

    return result.rows.map(UserMapper.fromDatabase);
  }
}

export default UserRepository;
