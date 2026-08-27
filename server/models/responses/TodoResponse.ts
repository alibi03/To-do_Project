import type { TodoStatus } from "../../domain/Todo";

class TodoResponseModel {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly description: string,
    readonly status: TodoStatus,
    readonly due_date: string | null,
    readonly created_at: Date,
    readonly updated_at: Date,
    readonly created_by_user_id: number,
    readonly assigned_to_user_id: number,
    readonly created_by_username: string,
    readonly assigned_to_username: string
  ) {}
}

export default TodoResponseModel;
