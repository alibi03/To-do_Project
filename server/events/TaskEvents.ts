import UuidGenerator from "../utils/UuidGenerator";

enum TaskEventType {
  Created = "task.created.v1",
  Assigned = "task.assigned.v1",
}

type TaskEvent = {
  schemaVersion: 1;
  eventId: string;
  eventType: TaskEventType;
  producer: "todo-service";
  occurredAt: string;
  taskId: string;
  title: string;
  createdByUserId: number;
  assignedToUserId: number | null;
};

class TaskEventFactory {
  private static create(
    eventType: TaskEventType,
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number | null
  ): TaskEvent {
    return {
      schemaVersion: 1,
      eventId: UuidGenerator.generateV7(),
      eventType,
      producer: "todo-service",
      occurredAt: new Date().toISOString(),
      taskId,
      title,
      createdByUserId,
      assignedToUserId,
    };
  }

  static taskCreated(
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number
  ): TaskEvent {
    return this.create(
      TaskEventType.Created,
      taskId,
      title,
      createdByUserId,
      assignedToUserId
    );
  }

  static taskAssigned(
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number
  ): TaskEvent {
    return this.create(
      TaskEventType.Assigned,
      taskId,
      title,
      createdByUserId,
      assignedToUserId
    );
  }
}

export { type TaskEvent, TaskEventFactory, TaskEventType };
