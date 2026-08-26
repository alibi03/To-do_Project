export type UserRole = "admin" | "member";

export type User = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at: string;
};

export type AssignmentUser = {
  id: number;
  username: string;
  role: UserRole;
};

export type TodoStatus = "pending" | "in_progress" | "completed";
export type TodoSortField = "status" | "dueDate";
export type SortOrder = "asc" | "desc";

export type Todo = {
  id: number;
  title: string;
  description: string;
  status: TodoStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  created_by_user_id: number;
  assigned_to_user_id: number;
  created_by_username: string;
  assigned_to_username: string;
};

export type AuthView = "login" | "register" | "reset";

export type MessageResponse = {
  message: string;
};
