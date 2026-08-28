import type Todo from "../models/domain/Todo";
import type TodoResponse from "../models/responses/TodoResponse";

class TodoResponseMapper {
  static toResponse(todo: Todo): TodoResponse {
    const {
      id,
      title,
      description,
      status,
      dueDate,
      createdAt,
      updatedAt,
      createdByUserId,
      assignedToUserId,
      createdByUsername,
      assignedToUsername,
    } = todo;

    return {
      id,
      title,
      description,
      status,
      due_date: dueDate,
      created_at: createdAt.toISOString(),
      updated_at: updatedAt.toISOString(),
      created_by_user_id: createdByUserId,
      assigned_to_user_id: assignedToUserId,
      created_by_username: createdByUsername,
      assigned_to_username: assignedToUsername,
    };
  }
}

export default TodoResponseMapper;
