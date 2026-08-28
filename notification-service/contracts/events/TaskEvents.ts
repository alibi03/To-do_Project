enum TaskEventType {
  Created = "task.created.v1",
  Assigned = "task.assigned.v1",
}

interface TaskEventEnvelope {
  schemaVersion: 1;
  eventId: string;
  eventType: TaskEventType;
  producer: "todo-service";
  occurredAt: string;
  taskId: string;
  title: string;
  createdByUserId: number;
  assignedToUserId: number | null;
}

interface TaskCreatedEvent extends TaskEventEnvelope {
  eventType: TaskEventType.Created;
}

interface TaskAssignedEvent extends TaskEventEnvelope {
  eventType: TaskEventType.Assigned;
  assignedToUserId: number;
}

type TaskEvent = TaskCreatedEvent | TaskAssignedEvent;

export {
  TaskEventType,
  type TaskAssignedEvent,
  type TaskCreatedEvent,
  type TaskEvent,
  type TaskEventEnvelope,
};
