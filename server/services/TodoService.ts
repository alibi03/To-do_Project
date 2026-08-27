import { DatabaseError } from "pg";

import {
  TodoUpdateField,
  type CreateTodoRequestDto,
  type TodoListQueryDto,
  type UpdateTodoRequestDto,
} from "../dtos/requests/TodoRequests";
import {
  ConcurrencyError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/ApplicationErrors";
import { type TaskEvent, TaskEventFactory } from "../events/TaskEvents";
import TodoResponseMapper from "../mappers/TodoResponseMapper";
import {
  CreateTodoModel,
  FindTodosModel,
  TodoSortField,
  TodoSortOrder,
  UpdateTodoModel,
} from "../models/repositories/TodoModels";
import type TodoResponseModel from "../models/responses/TodoResponse";
import todoRepository from "../repositories/TodoRepository";
import type { AuthenticatedUser } from "../types/authTypes";
import UuidGenerator from "../utils/UuidGenerator";
import AuthorizationService from "./AuthorizationService";

export class TodoService {
  private readonly updateFields = Object.values(TodoUpdateField);

  async listForUser(
    currentUser: AuthenticatedUser,
    query: TodoListQueryDto
  ): Promise<TodoResponseModel[]> {
    const todos = await todoRepository.findForUser(
      new FindTodosModel(
        currentUser.userId,
        currentUser.role,
        query.search ?? "",
        query.sortBy ?? TodoSortField.DueDate,
        query.sortOrder ?? TodoSortOrder.Ascending
      )
    );

    return todos.map(TodoResponseMapper.toResponse);
  }

  async create(
    currentUser: AuthenticatedUser,
    input: CreateTodoRequestDto
  ): Promise<TodoResponseModel> {
    AuthorizationService.requireAdmin(currentUser.role);

    const todoId = UuidGenerator.generateV7();

    const model = new CreateTodoModel(
      todoId,
      currentUser.userId,
      input.assignedToUserId,
      input.title,
      input.description ?? "",
      input.dueDate ?? null
    );
    const events = [
      TaskEventFactory.taskCreated(
        todoId,
        input.title,
        currentUser.userId,
        input.assignedToUserId
      ),
      TaskEventFactory.taskAssigned(
        todoId,
        input.title,
        currentUser.userId,
        input.assignedToUserId
      ),
    ];

    try {
      const todo = await todoRepository.create(model, events);
      return TodoResponseMapper.toResponse(todo);
    } catch (error) {
      if (error instanceof DatabaseError && error.code === "23503") {
        throw new ValidationError("Assigned user does not exist.");
      }

      throw error;
    }
  }

  async update(
    currentUser: AuthenticatedUser,
    todoId: string,
    input: UpdateTodoRequestDto
  ): Promise<TodoResponseModel> {
    if (!this.updateFields.some((field) => input[field] !== undefined)) {
      throw new ValidationError("At least one task field must be provided.");
    }

    const existingTodo = await todoRepository.findById(todoId);

    if (!existingTodo) {
      throw new NotFoundError("To-do not found.");
    }

    AuthorizationService.requireTodoUpdatePermission(
      currentUser,
      existingTodo,
      input
    );

    const assigneeChanged =
      input.assignedToUserId !== undefined &&
      input.assignedToUserId !== existingTodo.assignedToUserId;
    const model = new UpdateTodoModel(
      input.title ?? null,
      input.description ?? null,
      input.status ?? null,
      input.dueDate ?? null,
      input.assignedToUserId ?? null,
      input.assignedToUserId !== undefined
        ? existingTodo.assignedToUserId
        : null
    );
    const events: TaskEvent[] = [];

    if (assigneeChanged && input.assignedToUserId !== undefined) {
      events.push(
        TaskEventFactory.taskAssigned(
          todoId,
          input.title ?? existingTodo.title,
          existingTodo.createdByUserId,
          input.assignedToUserId
        )
      );
    }

    try {
      const todo = await todoRepository.update(todoId, model, events);
      return TodoResponseMapper.toResponse(todo);
    } catch (error) {
      if (error instanceof ConcurrencyError) {
        throw new ConflictError(
          "The task was changed by another request. Refresh and try again."
        );
      }

      if (error instanceof DatabaseError && error.code === "23503") {
        throw new ValidationError("Assigned user does not exist.");
      }

      throw error;
    }
  }

  async remove(currentUser: AuthenticatedUser, todoId: string): Promise<void> {
    AuthorizationService.requireAdmin(currentUser.role);

    const deleted = await todoRepository.deleteById(todoId);

    if (!deleted) {
      throw new NotFoundError("To-do not found.");
    }
  }
}

const todoService = new TodoService();

export default todoService;
