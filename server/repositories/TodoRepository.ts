import pool from "../config/database";
import type Todo from "../domain/Todo";
import { PersistenceError } from "../errors/ApplicationErrors";
import { TodoMapper, type TodoDatabaseRecord } from "../mappers/TodoMapper";
import {
  CreateTodoModel,
  FindTodosModel,
  TodoSortField,
  TodoSortOrder,
  UpdateTodoModel,
} from "../models/repositories/TodoModels";
import { UserRole } from "../types/authTypes";

export class TodoRepository {
  private readonly selectTodo = `SELECT
    t.id,
    t.title,
    t.description,
    t.status,
    t.due_date,
    t.created_at,
    t.updated_at,
    t.created_by_user_id,
    t.assigned_to_user_id,
    creator.username AS created_by_username,
    assignee.username AS assigned_to_username
  FROM todos t
  JOIN users creator ON creator.id = t.created_by_user_id
  JOIN users assignee ON assignee.id = t.assigned_to_user_id`;

  private readonly statusRankSql = `CASE t.status
    WHEN 'pending' THEN 1
    WHEN 'in_progress' THEN 2
    WHEN 'completed' THEN 3
  END`;

  private readonly sortDirections = new Map<TodoSortOrder, string>([
    [TodoSortOrder.Ascending, "ASC"],
    [TodoSortOrder.Descending, "DESC"],
  ]);

  private readonly orderByBuilders = new Map<
    TodoSortField,
    (direction: string) => string
  >([
    [
      TodoSortField.Status,
      (direction) =>
        `${this.statusRankSql} ${direction}, t.due_date ASC NULLS LAST, t.created_at DESC`,
    ],
    [
      TodoSortField.DueDate,
      (direction) =>
        `t.due_date ${direction} NULLS LAST, ${this.statusRankSql} ASC, t.created_at DESC`,
    ],
  ]);

  private buildOrderBy(
    sortBy: TodoSortField,
    sortOrder: TodoSortOrder
  ): string {
    const direction = this.sortDirections.get(sortOrder);
    const buildOrder = this.orderByBuilders.get(sortBy);

    if (!direction || !buildOrder) {
      throw new PersistenceError("Validated task sort mapping was not found.");
    }

    return buildOrder(direction);
  }

  async findById(todoId: number): Promise<Todo | null> {
    const result = await pool.query<TodoDatabaseRecord>(
      `${this.selectTodo}
       WHERE t.id = $1`,
      [todoId]
    );

    return result.rows[0] ? TodoMapper.fromDatabase(result.rows[0]) : null;
  }

  async findForUser(model: FindTodosModel): Promise<Todo[]> {
    const { userId, role, search, sortBy, sortOrder } = model;
    const values: Array<number | string> = [];
    const conditions: string[] = [];

    if (role !== UserRole.Admin) {
      values.push(userId);
      conditions.push(`t.assigned_to_user_id = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(
        `(t.title ILIKE $${values.length} OR t.description ILIKE $${values.length})`
      );
    }

    const whereClause = conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "";
    const orderBy = this.buildOrderBy(sortBy, sortOrder);
    const result = await pool.query<TodoDatabaseRecord>(
      `${this.selectTodo}
       ${whereClause}
       ORDER BY ${orderBy}`,
      values
    );

    return result.rows.map(TodoMapper.fromDatabase);
  }

  async create(model: CreateTodoModel): Promise<Todo> {
    const { creatorId, assigneeId, title, description, dueDate } = model;
    const result = await pool.query<{ id: number }>(
      `INSERT INTO todos
         (created_by_user_id, assigned_to_user_id, title, description, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [creatorId, assigneeId, title, description, dueDate]
    );

    const createdRow = result.rows[0];

    if (!createdRow) {
      throw new PersistenceError("Created task did not return an ID.");
    }

    const todo = await this.findById(createdRow.id);

    if (!todo) {
      throw new PersistenceError("Created task could not be reloaded.");
    }

    return todo;
  }

  async update(todoId: number, model: UpdateTodoModel): Promise<Todo> {
    const { title, description, status, dueDate, assigneeId } = model;
    await pool.query(
      `UPDATE todos
       SET
         title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         due_date = COALESCE($4, due_date),
         assigned_to_user_id = COALESCE($5, assigned_to_user_id),
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $6`,
      [title, description, status, dueDate, assigneeId, todoId]
    );

    const todo = await this.findById(todoId);

    if (!todo) {
      throw new PersistenceError("Updated task could not be reloaded.");
    }

    return todo;
  }

  async deleteById(todoId: number): Promise<boolean> {
    const result = await pool.query<{ id: number }>(
      `DELETE FROM todos
       WHERE id = $1
       RETURNING id`,
      [todoId]
    );

    return Boolean(result.rows[0]);
  }
}

const todoRepository = new TodoRepository();

export default todoRepository;
