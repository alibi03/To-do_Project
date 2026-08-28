import type { PoolClient } from "pg";

import type { TaskEvent } from "../contracts/events/TaskEvents";
import type PasswordResetCode from "../models/domain/PasswordResetCode";
import type Todo from "../models/domain/Todo";
import type User from "../models/domain/User";
import type { FindTodosModel } from "../models/queries/TodoQueries";
import type OutboxEventModel from "../models/repositories/OutboxModels";
import type {
  ConsumePasswordResetModel,
  CreatePasswordResetModel,
} from "../models/repositories/PasswordResetModels";
import type {
  CreateTodoModel,
  UpdateTodoModel,
} from "../models/repositories/TodoModels";
import type { CreateUserModel } from "../models/repositories/UserModels";

interface OutboxRepositoryPort {
  add(client: PoolClient, events: TaskEvent[]): Promise<void>;
  claimPending(limit: number): Promise<OutboxEventModel[]>;
  markPublished(eventId: string): Promise<void>;
  markFailed(eventId: string, message: string): Promise<void>;
}

interface PasswordResetRepositoryPort {
  replaceActiveForUser(
    model: CreatePasswordResetModel
  ): Promise<PasswordResetCode>;
  findLatestActiveForUser(userId: number): Promise<PasswordResetCode | null>;
  consumeAndUpdatePassword(model: ConsumePasswordResetModel): Promise<boolean>;
}

interface SystemRepositoryPort {
  getDatabaseTime(): Promise<Date>;
}

interface TodoRepositoryPort {
  findById(todoId: string): Promise<Todo | null>;
  findForUser(model: FindTodosModel): Promise<Todo[]>;
  create(model: CreateTodoModel, events: TaskEvent[]): Promise<Todo>;
  update(
    todoId: string,
    model: UpdateTodoModel,
    events: TaskEvent[]
  ): Promise<Todo>;
  deleteById(todoId: string): Promise<boolean>;
}

interface UserRepositoryPort {
  create(model: CreateUserModel): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findById(userId: number): Promise<User | null>;
  listForAssignment(): Promise<User[]>;
}

export {
  type OutboxRepositoryPort,
  type PasswordResetRepositoryPort,
  type SystemRepositoryPort,
  type TodoRepositoryPort,
  type UserRepositoryPort,
};
