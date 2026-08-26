import type { Request, Response } from "express";

import {
  CreateTodoRequestDto,
  TodoIdParamsDto,
  TodoListQueryDto,
  UpdateTodoRequestDto,
} from "../dtos/requests/TodoRequests";
import MessageResponseModel from "../models/responses/MessageResponse";
import {
  TodoListResponseModel,
  TodoMutationResponseModel,
} from "../models/responses/TodoResponses";
import todoService from "../services/TodoService";
import AuthenticatedUserResolver from "../utils/AuthenticatedUserResolver";
import RequestValidator from "../utils/RequestValidator";

type EmptyParams = Record<string, never>;

async function list(
  request: Request<EmptyParams, TodoListResponseModel, object, object>,
  response: Response<TodoListResponseModel>
): Promise<Response<TodoListResponseModel>> {
  const currentUser = AuthenticatedUserResolver.resolve(request);
  const query = await RequestValidator.validate(
    TodoListQueryDto,
    request.query
  );
  const todos = await todoService.listForUser(currentUser, query);

  return response.json(new TodoListResponseModel(todos));
}

async function create(
  request: Request<EmptyParams, TodoMutationResponseModel, object>,
  response: Response<TodoMutationResponseModel>
): Promise<Response<TodoMutationResponseModel>> {
  const currentUser = AuthenticatedUserResolver.resolve(request);
  const input = await RequestValidator.validate(
    CreateTodoRequestDto,
    request.body
  );
  const todo = await todoService.create(currentUser, input);

  return response
    .status(201)
    .json(new TodoMutationResponseModel("To-do created successfully.", todo));
}

async function update(
  request: Request<{ id: string }, TodoMutationResponseModel, object>,
  response: Response<TodoMutationResponseModel>
): Promise<Response<TodoMutationResponseModel>> {
  const currentUser = AuthenticatedUserResolver.resolve(request);
  const params = await RequestValidator.validate(
    TodoIdParamsDto,
    request.params
  );
  const input = await RequestValidator.validate(
    UpdateTodoRequestDto,
    request.body
  );
  const todo = await todoService.update(currentUser, params.id, input);

  return response.json(
    new TodoMutationResponseModel("To-do updated successfully.", todo)
  );
}

async function remove(
  request: Request<{ id: string }, MessageResponseModel>,
  response: Response<MessageResponseModel>
): Promise<Response<MessageResponseModel>> {
  const currentUser = AuthenticatedUserResolver.resolve(request);
  const params = await RequestValidator.validate(
    TodoIdParamsDto,
    request.params
  );
  await todoService.remove(currentUser, params.id);

  return response.json(new MessageResponseModel("To-do deleted successfully."));
}

export { create, list, remove, update };
