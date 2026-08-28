import { inject, injectable } from "inversify";
import { DatabaseError } from "pg";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import {
  ConcurrencyError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from "../errors/ApplicationErrors";
import type { TaskEvent } from "../contracts/events/TaskEvents";
import type Todo from "../models/domain/Todo";
import {
  FindTodosModel,
  TodoSortField,
  TodoSortOrder,
} from "../models/queries/TodoQueries";
import {
  TodoUpdateField,
  type CreateTodoRequestDto,
  type TodoListQueryDto,
  type UpdateTodoRequestDto,
} from "../models/requests/TodoRequests";
import {
  CreateTodoModel,
  UpdateTodoModel,
} from "../models/repositories/TodoModels";
import type {
  TaskEventFactoryPort,
  UuidGeneratorPort,
} from "../ports/InfrastructurePorts";
import type { TodoRepositoryPort } from "../ports/RepositoryPorts";
import type {
  AuthorizationServicePort,
  TodoServicePort,
} from "../ports/ServicePorts";
import type { AuthenticatedUser } from "../types/AuthTypes";

@injectable()
class TodoService implements TodoServicePort {
  private readonly updateFields = Object.values(TodoUpdateField);

  constructor(
    @inject(DependencySymbols.TodoRepository)
    private readonly todoRepository: TodoRepositoryPort,
    @inject(DependencySymbols.AuthorizationService)
    private readonly authorizationService: AuthorizationServicePort,
    @inject(DependencySymbols.TaskEventFactory)
    private readonly taskEventFactory: TaskEventFactoryPort,
    @inject(DependencySymbols.UuidGenerator)
    private readonly uuidGenerator: UuidGeneratorPort
  ) {}

  async listForUser(
    currentUser: AuthenticatedUser,
    query: TodoListQueryDto
  ): Promise<Todo[]> {
    return this.todoRepository.findForUser(
      new FindTodosModel(
        currentUser.userId,
        currentUser.role,
        query.search ?? "",
        query.sortBy ?? TodoSortField.DueDate,
        query.sortOrder ?? TodoSortOrder.Ascending
      )
    );
  }

  async create(
    currentUser: AuthenticatedUser,
    input: CreateTodoRequestDto
  ): Promise<Todo> {
    this.authorizationService.requireAdmin(currentUser.role);

    const todoId = this.uuidGenerator.generateV7();
    const model = new CreateTodoModel(
      todoId,
      currentUser.userId,
      input.assignedToUserId,
      input.title,
      input.description ?? "",
      input.dueDate ?? null
    );
    const events = [
      this.taskEventFactory.taskCreated(
        todoId,
        input.title,
        currentUser.userId,
        input.assignedToUserId
      ),
      this.taskEventFactory.taskAssigned(
        todoId,
        input.title,
        currentUser.userId,
        input.assignedToUserId
      ),
    ];

    try {
      return await this.todoRepository.create(model, events);
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
  ): Promise<Todo> {
    if (!this.updateFields.some((field) => input[field] !== undefined)) {
      throw new ValidationError("At least one task field must be provided.");
    }

    const existingTodo = await this.todoRepository.findById(todoId);

    if (!existingTodo) {
      throw new NotFoundError("To-do not found.");
    }

    this.authorizationService.requireTodoUpdatePermission(
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
        this.taskEventFactory.taskAssigned(
          todoId,
          input.title ?? existingTodo.title,
          existingTodo.createdByUserId,
          input.assignedToUserId
        )
      );
    }

    try {
      return await this.todoRepository.update(todoId, model, events);
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
    this.authorizationService.requireAdmin(currentUser.role);

    const deleted = await this.todoRepository.deleteById(todoId);

    if (!deleted) {
      throw new NotFoundError("To-do not found.");
    }
  }
}

export default TodoService;
