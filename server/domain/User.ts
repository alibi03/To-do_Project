import type { UserRole } from "../types/authTypes";

class User {
  constructor(
    readonly id: number,
    readonly username: string,
    readonly email: string,
    readonly passwordHash: string,
    readonly role: UserRole,
    readonly createdAt: Date
  ) {}
}

export default User;
