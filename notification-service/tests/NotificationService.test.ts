import assert from "node:assert/strict";
import test from "node:test";

import {
  TaskEventType,
  type TaskAssignedEvent,
} from "../contracts/events/TaskEvents";
import type {
  CreateNotificationModel,
  NotificationRow,
} from "../models/repositories/NotificationModels";
import type { IdGeneratorPort } from "../ports/InfrastructurePorts";
import type { NotificationRepositoryPort } from "../ports/RepositoryPorts";
import NotificationService from "../services/NotificationService";

class FakeNotificationRepository implements NotificationRepositoryPort {
  inserted: CreateNotificationModel | null = null;

  async insert(model: CreateNotificationModel): Promise<void> {
    this.inserted = model;
  }

  async findAssignedToUser(
    _recipientUserId: number,
    _limit: number
  ): Promise<NotificationRow[]> {
    return [];
  }
}

class FakeIdGenerator implements IdGeneratorPort {
  generate(): string {
    return "0199429f-4be4-7000-8000-000000000010";
  }
}

test("NotificationService accepts repository and ID-generator fakes", async () => {
  const repository = new FakeNotificationRepository();
  const service = new NotificationService(repository, new FakeIdGenerator());
  const event: TaskAssignedEvent = {
    schemaVersion: 1,
    eventId: "0199429f-4be4-7000-8000-000000000011",
    eventType: TaskEventType.Assigned,
    producer: "todo-service",
    occurredAt: "2026-08-27T12:00:00.000Z",
    taskId: "0199429f-4be4-7000-8000-000000000012",
    title: "Review notifications",
    createdByUserId: 4,
    assignedToUserId: 1,
  };

  await service.record(event);

  assert.deepEqual(repository.inserted, {
    id: "0199429f-4be4-7000-8000-000000000010",
    eventId: event.eventId,
    eventType: TaskEventType.Assigned,
    recipientUserId: event.assignedToUserId,
    taskId: event.taskId,
    message: 'Task "Review notifications" was assigned to you.',
    createdAt: event.occurredAt,
  });
});
