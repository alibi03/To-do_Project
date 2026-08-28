import assert from "node:assert/strict";
import test from "node:test";

import { validate as isUuid, version as uuidVersion } from "uuid";

import {
  TaskEventType,
} from "../contracts/events/TaskEvents";
import TaskEventFactory from "../factories/TaskEventFactory";
import UuidGenerator from "../utils/UuidGenerator";

test("UUID generator creates unique UUIDv7 task IDs", () => {
  const uuidGenerator = new UuidGenerator();
  const ids = Array.from({ length: 10_000 }, () =>
    uuidGenerator.generateV7()
  );

  assert.equal(new Set(ids).size, ids.length);

  for (const id of ids) {
    assert.equal(isUuid(id), true);
    assert.equal(uuidVersion(id), 7);
  }
});

test("task event factory creates the versioned event contract", () => {
  const uuidGenerator = new UuidGenerator();
  const taskEventFactory = new TaskEventFactory(uuidGenerator);
  const taskId = uuidGenerator.generateV7();
  const event = taskEventFactory.taskAssigned(taskId, "Review task", 4, 1);

  assert.deepEqual(Object.keys(event).sort(), [
    "assignedToUserId",
    "createdByUserId",
    "eventId",
    "eventType",
    "occurredAt",
    "producer",
    "schemaVersion",
    "taskId",
    "title",
  ]);
  assert.equal(event.eventType, TaskEventType.Assigned);
  assert.equal(event.schemaVersion, 1);
  assert.equal(event.producer, "todo-service");
  assert.equal(event.taskId, taskId);
  assert.equal(event.createdByUserId, 4);
  assert.equal(event.assignedToUserId, 1);
  assert.equal(new Date(event.occurredAt).toISOString(), event.occurredAt);
  assert.equal(uuidVersion(event.eventId), 7);
});
