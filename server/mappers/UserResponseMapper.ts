import type User from "../models/domain/User";
import type {
  AssignmentUserResponse,
  PublicUserResponse,
} from "../models/responses/UserResponses";

class UserResponseMapper {
  static toPublicResponse(user: User): PublicUserResponse {
    const { id, username, email, role, createdAt } = user;

    return {
      id,
      username,
      email,
      role,
      created_at: createdAt.toISOString(),
    };
  }

  static toAssignmentResponse(user: User): AssignmentUserResponse {
    const { id, username, role } = user;
    return { id, username, role };
  }
}

export default UserResponseMapper;
