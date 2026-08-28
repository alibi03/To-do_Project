import { inject, injectable } from "inversify";

import {
  type TaskEvent,
  type TaskEventEnvelope,
  TaskEventType,
} from "../contracts/events/TaskEvents";
import DependencySymbols from "../dependencyInjection/DependencySymbols";
import type {
  TaskEventFactoryPort,
  UuidGeneratorPort,
} from "../ports/InfrastructurePorts";

@injectable()
class TaskEventFactory implements TaskEventFactoryPort {
  constructor(
    @inject(DependencySymbols.UuidGenerator)
    private readonly uuidGenerator: UuidGeneratorPort
  ) {}

  taskCreated(
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number
  ): TaskEvent {
    return {
      ...this.createEnvelope(taskId, title, createdByUserId),
      eventType: TaskEventType.Created,
      assignedToUserId,
    };
  }

  taskAssigned(
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number
  ): TaskEvent {
    return {
      ...this.createEnvelope(taskId, title, createdByUserId),
      eventType: TaskEventType.Assigned,
      assignedToUserId,
    };
  }

  private createEnvelope(
    taskId: string,
    title: string,
    createdByUserId: number
  ): Omit<TaskEventEnvelope, "eventType" | "assignedToUserId"> {
    return {
      schemaVersion: 1,
      eventId: this.uuidGenerator.generateV7(),
      producer: "todo-service",
      occurredAt: new Date().toISOString(),
      taskId,
      title,
      createdByUserId,
    };
  }
}

export default TaskEventFactory;
