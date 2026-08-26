import { UserMapper } from "../mappers/UserMapper";
import type { AssignmentUserResponseModel } from "../models/responses/UserResponses";
import userRepository from "../repositories/UserRepository";
import type { UserRole } from "../types/authTypes";
import AuthorizationService from "./AuthorizationService";

export class UserService {
  async listForAssignment(
    role: UserRole
  ): Promise<AssignmentUserResponseModel[]> {
    AuthorizationService.requireAdmin(
      role,
      "Only administrators can view assignment options."
    );

    const users = await userRepository.listForAssignment();
    return users.map(UserMapper.toAssignmentResponse);
  }
}

const userService = new UserService();

export default userService;
