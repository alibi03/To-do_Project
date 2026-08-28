import type { TodoStatus } from "../domain/Todo";

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
  UpdateTodoModel,
};
