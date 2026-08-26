import { DatabaseError } from "pg";

import {
  TodoUpdateField,
  type CreateTodoRequestDto,
  type TodoListQueryDto,
  type UpdateTodoRequestDto,
} from "../dtos/requests/TodoRequests";
import { NotFoundError, ValidationError } from "../errors/ApplicationErrors";
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

    const model = new CreateTodoModel(
      currentUser.userId,
      input.assignedToUserId,
      input.title,
      input.description ?? "",
      input.dueDate ?? null
    );

    try {
      const todo = await todoRepository.create(model);
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
    todoId: number,
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

    const model = new UpdateTodoModel(
      input.title ?? null,
      input.description ?? null,
      input.status ?? null,
      input.dueDate ?? null,
      input.assignedToUserId ?? null
    );

    try {
      const todo = await todoRepository.update(todoId, model);
      return TodoResponseMapper.toResponse(todo);
    } catch (error) {
      if (error instanceof DatabaseError && error.code === "23503") {
        throw new ValidationError("Assigned user does not exist.");
      }

      throw error;
    }
  }

  async remove(currentUser: AuthenticatedUser, todoId: number): Promise<void> {
    AuthorizationService.requireAdmin(currentUser.role);

    const deleted = await todoRepository.deleteById(todoId);

    if (!deleted) {
      throw new NotFoundError("To-do not found.");
    }
  }
}

const todoService = new TodoService();

export default todoService;
