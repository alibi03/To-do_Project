import assert from "node:assert/strict";
import test from "node:test";

import type { TaskEvent } from "../contracts/events/TaskEvents";
import { TaskEventType } from "../contracts/events/TaskEvents";
import Todo, { TodoStatus } from "../models/domain/Todo";
import type { FindTodosModel } from "../models/queries/TodoQueries";
import type { CreateTodoRequestDto } from "../models/requests/TodoRequests";
import type {
  CreateTodoModel,
  UpdateTodoModel,
} from "../models/repositories/TodoModels";
import type {
  TaskEventFactoryPort,
  UuidGeneratorPort,
} from "../ports/InfrastructurePorts";
import type { TodoRepositoryPort } from "../ports/RepositoryPorts";
import type { AuthorizationServicePort } from "../ports/ServicePorts";
import TodoService from "../services/TodoService";
import { UserRole } from "../types/AuthTypes";

class FakeTodoRepository implements TodoRepositoryPort {
  createdModel: CreateTodoModel | null = null;
  createdEvents: TaskEvent[] = [];

  constructor(private readonly todo: Todo) {}

  async findById(_todoId: string): Promise<Todo | null> {
    return this.todo;
  }

  async findForUser(_model: FindTodosModel): Promise<Todo[]> {
    return [this.todo];
  }

  async create(model: CreateTodoModel, events: TaskEvent[]): Promise<Todo> {
    this.createdModel = model;
    this.createdEvents = events;
    return this.todo;
  }

  async update(
    _todoId: string,
    _model: UpdateTodoModel,
    _events: TaskEvent[]
  ): Promise<Todo> {
    return this.todo;
  }

  async deleteById(_todoId: string): Promise<boolean> {
    return true;
  }
}

class FakeAuthorizationService implements AuthorizationServicePort {
  adminCheckCount = 0;

  requireAdmin(_role: UserRole, _message?: string): void {
    this.adminCheckCount += 1;
  }

  requireTodoUpdatePermission(): void {}
}

class FakeUuidGenerator implements UuidGeneratorPort {
  constructor(private readonly id: string) {}

  generateV7(): string {
    return this.id;
  }
}

class FakeTaskEventFactory implements TaskEventFactoryPort {
  taskCreated(
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number
  ): TaskEvent {
    return this.createEvent(
      TaskEventType.Created,
      "0199429f-4be4-7000-8000-000000000001",
      taskId,
      title,
      createdByUserId,
      assignedToUserId
    );
  }

  taskAssigned(
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number
  ): TaskEvent {
    return this.createEvent(
      TaskEventType.Assigned,
      "0199429f-4be4-7000-8000-000000000002",
      taskId,
      title,
      createdByUserId,
      assignedToUserId
    );
  }

  private createEvent(
    eventType: TaskEventType,
    eventId: string,
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number
  ): TaskEvent {
    return {
      schemaVersion: 1,
      eventId,
      eventType,
      producer: "todo-service",
      occurredAt: "2026-08-27T12:00:00.000Z",
      taskId,
      title,
      createdByUserId,
      assignedToUserId,
    };
  }
}

test("TodoService accepts replaceable dependencies through its constructor", async () => {
  const taskId = "0199429f-4be4-7000-8000-000000000000";
  const todo = new Todo(
    taskId,
    "Review dependency injection",
    "",
    TodoStatus.Pending,
    null,
    new Date("2026-08-27T12:00:00.000Z"),
    new Date("2026-08-27T12:00:00.000Z"),
    4,
    1,
    "admin",
    "member"
  );
  const repository = new FakeTodoRepository(todo);
  const authorization = new FakeAuthorizationService();
  const service = new TodoService(
    repository,
    authorization,
    new FakeTaskEventFactory(),
    new FakeUuidGenerator(taskId)
  );
  const input: CreateTodoRequestDto = {
    title: todo.title,
    assignedToUserId: todo.assignedToUserId,
  };

  const result = await service.create(
    { userId: todo.createdByUserId, role: UserRole.Admin },
    input
  );

  assert.equal(result, todo);
  assert.equal(authorization.adminCheckCount, 1);
  assert.equal(repository.createdModel?.id, taskId);
  assert.deepEqual(
    repository.createdEvents.map((event) => event.eventType),
    [TaskEventType.Created, TaskEventType.Assigned]
  );
});
