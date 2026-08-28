import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import TodoResponseMapper from "../mappers/TodoResponseMapper";
import {
  CreateTodoRequestDto,
  TodoIdParamsDto,
  TodoListQueryDto,
  UpdateTodoRequestDto,
} from "../models/requests/TodoRequests";
import type MessageResponse from "../models/responses/MessageResponse";
import type {
  TodoListResponse,
  TodoMutationResponse,
} from "../models/responses/TodoResponses";
import type { TodoServicePort } from "../ports/ServicePorts";
import AuthenticatedUserResolver from "../utils/AuthenticatedUserResolver";
import RequestValidator from "../utils/RequestValidator";

type EmptyParams = Record<string, never>;

@injectable()
class TodoController {
  constructor(
    @inject(DependencySymbols.TodoService)
    private readonly todoService: TodoServicePort
  ) {}

  readonly list = async (
    request: Request<EmptyParams, TodoListResponse, object, object>,
    response: Response<TodoListResponse>
  ): Promise<Response<TodoListResponse>> => {
    const currentUser = AuthenticatedUserResolver.resolve(request);
    const query = await RequestValidator.validate(
      TodoListQueryDto,
      request.query
    );
    const todos = await this.todoService.listForUser(currentUser, query);

    return response.json({
      todos: todos.map(TodoResponseMapper.toResponse),
    });
  };

  readonly create = async (
    request: Request<EmptyParams, TodoMutationResponse, object>,
    response: Response<TodoMutationResponse>
  ): Promise<Response<TodoMutationResponse>> => {
    const currentUser = AuthenticatedUserResolver.resolve(request);
    const input = await RequestValidator.validate(
      CreateTodoRequestDto,
      request.body
    );
    const todo = await this.todoService.create(currentUser, input);

    return response.status(201).json({
      message: "To-do created successfully.",
      todo: TodoResponseMapper.toResponse(todo),
    });
  };

  readonly update = async (
    request: Request<{ id: string }, TodoMutationResponse, object>,
    response: Response<TodoMutationResponse>
  ): Promise<Response<TodoMutationResponse>> => {
    const currentUser = AuthenticatedUserResolver.resolve(request);
    const params = await RequestValidator.validate(
      TodoIdParamsDto,
      request.params
    );
    const input = await RequestValidator.validate(
      UpdateTodoRequestDto,
      request.body
    );
    const todo = await this.todoService.update(currentUser, params.id, input);

    return response.json({
      message: "To-do updated successfully.",
      todo: TodoResponseMapper.toResponse(todo),
    });
  };

  readonly remove = async (
    request: Request<{ id: string }, MessageResponse>,
    response: Response<MessageResponse>
  ): Promise<Response<MessageResponse>> => {
    const currentUser = AuthenticatedUserResolver.resolve(request);
    const params = await RequestValidator.validate(
      TodoIdParamsDto,
      request.params
    );
    await this.todoService.remove(currentUser, params.id);

    return response.json({ message: "To-do deleted successfully." });
  };
}

export default TodoController;
