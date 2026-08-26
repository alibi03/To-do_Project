import type Todo from "../domain/Todo";
import TodoResponseModel from "../models/responses/TodoResponse";

class TodoResponseMapper {
  static toResponse(todo: Todo): TodoResponseModel {
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

    return new TodoResponseModel(
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
      assignedToUsername
    );
  }
}

export default TodoResponseMapper;
