import type { UserRole } from "../../types/AuthTypes";

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

export { FindTodosModel, TodoSortField, TodoSortOrder };
