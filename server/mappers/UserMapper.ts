import User from "../models/domain/User";
import type { UserRole } from "../types/AuthTypes";

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

}

export { UserMapper, type UserDatabaseRecord };
