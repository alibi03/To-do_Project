import type { TodoStatus } from "../../domain/Todo";
import type { UserRole } from "../../types/authTypes";

enum TodoSortField {
  Status = "status",
  DueDate = "dueDate",
}

enum TodoSortOrder {
  Ascending = "asc",
  Descending = "desc",
}

class FindTodosModel {
  constructor(
    readonly userId: number,
    readonly role: UserRole,
    readonly search: string,
    readonly sortBy: TodoSortField,
    readonly sortOrder: TodoSortOrder
  ) {}
}

class CreateTodoModel {
  constructor(
    readonly id: string,
    readonly creatorId: number,
    readonly assigneeId: number,
    readonly title: string,
    readonly description: string,
    readonly dueDate: string | null
  ) {}
}

class UpdateTodoModel {
  constructor(
    readonly title: string | null,
    readonly description: string | null,
    readonly status: TodoStatus | null,
    readonly dueDate: string | null,
    readonly assigneeId: number | null,
    readonly expectedAssigneeId: number | null
  ) {}
}

export {
  CreateTodoModel,
  FindTodosModel,
  TodoSortField,
  TodoSortOrder,
  UpdateTodoModel,
};
