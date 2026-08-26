import type { Request, Response } from "express";

import UserListResponseModel from "../models/responses/UserListResponse";
import userService from "../services/UserService";
import AuthenticatedUserResolver from "../utils/AuthenticatedUserResolver";

async function list(
  request: Request,
  response: Response<UserListResponseModel>
): Promise<Response<UserListResponseModel>> {
  const currentUser = AuthenticatedUserResolver.resolve(request);
  const users = await userService.listForAssignment(currentUser.role);

  return response.json(new UserListResponseModel(users));
}

export { list };
