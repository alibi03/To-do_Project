import type { UserRole } from "../../types/authTypes";

class PublicUserResponseModel {
  constructor(
    readonly id: number,
    readonly username: string,
    readonly email: string,
    readonly role: UserRole,
    readonly created_at: Date
  ) {}
}

class AssignmentUserResponseModel {
  constructor(
    readonly id: number,
    readonly username: string,
    readonly role: UserRole
  ) {}
}

export { AssignmentUserResponseModel, PublicUserResponseModel };
