import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import UserResponseMapper from "../mappers/UserResponseMapper";
import type UserListResponse from "../models/responses/UserListResponse";
import type { UserServicePort } from "../ports/ServicePorts";
import AuthenticatedUserResolver from "../utils/AuthenticatedUserResolver";

@injectable()
class UserController {
  constructor(
    @inject(DependencySymbols.UserService)
    private readonly userService: UserServicePort
  ) {}

  readonly list = async (
    request: Request,
    response: Response<UserListResponse>
  ): Promise<Response<UserListResponse>> => {
    const currentUser = AuthenticatedUserResolver.resolve(request);
    const users = await this.userService.listForAssignment(currentUser.role);

    return response.json({
      users: users.map(UserResponseMapper.toAssignmentResponse),
    });
  };
}

export default UserController;
