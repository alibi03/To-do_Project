import type { UserRole } from "../../types/AuthTypes";

interface PublicUserResponse {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
}

interface AssignmentUserResponse {
  id: number;
  username: string;
  role: UserRole;
}

export { type AssignmentUserResponse, type PublicUserResponse };
