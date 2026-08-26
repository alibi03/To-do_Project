import User from "../domain/User";
import {
  AssignmentUserResponseModel,
  PublicUserResponseModel,
} from "../models/responses/UserResponses";
import type { UserRole } from "../types/authTypes";

type UserDatabaseRecord = {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  role: UserRole;
  created_at: Date;
};

class UserMapper {
  static fromDatabase(record: UserDatabaseRecord): User {
    const { id, username, email, password_hash, role, created_at } = record;
    return new User(id, username, email, password_hash, role, created_at);
  }

  static toPublicResponse(user: User): PublicUserResponseModel {
    const { id, username, email, role, createdAt } = user;
    return new PublicUserResponseModel(id, username, email, role, createdAt);
  }

  static toAssignmentResponse(user: User): AssignmentUserResponseModel {
    const { id, username, role } = user;
    return new AssignmentUserResponseModel(id, username, role);
  }
}

export { UserMapper, type UserDatabaseRecord };
