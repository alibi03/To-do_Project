import type { TodoStatus } from "../domain/Todo";

interface TodoResponse {
  id: string;
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
}

export default TodoResponse;
