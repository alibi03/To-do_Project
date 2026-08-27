enum TodoStatus {
  Pending = "pending",
  InProgress = "in_progress",
  Completed = "completed",
}

class Todo {
  constructor(
    readonly id: string,
    readonly title: string,
    readonly description: string,
    readonly status: TodoStatus,
    readonly dueDate: string | null,
    readonly createdAt: Date,
    readonly updatedAt: Date,
    readonly createdByUserId: number,
    readonly assignedToUserId: number,
    readonly createdByUsername: string,
    readonly assignedToUsername: string
  ) {}
}

export default Todo;
export { TodoStatus };
