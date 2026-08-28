import assert from "node:assert/strict";
import test from "node:test";

import type { MessageProperties } from "amqplib";
import { v7 as uuidV7 } from "uuid";

import { TaskEventType } from "../contracts/events/TaskEvents";
import InvalidTaskEventError from "../errors/EventErrors";
import TaskEventParser from "../parsers/TaskEventParser";

function createEvent() {
  return {
    schemaVersion: 1,
    eventId: uuidV7(),
    eventType: TaskEventType.Assigned,
    producer: "todo-service",
    occurredAt: new Date().toISOString(),
    taskId: uuidV7(),
    title: "Review task",
    createdByUserId: 4,
    assignedToUserId: 1,
  } as const;
}

function createProperties(eventId: string): MessageProperties {
  return {
    contentType: "application/json",
    contentEncoding: "utf-8",
    headers: {},
    deliveryMode: 2,
    priority: undefined,
    correlationId: undefined,
    replyTo: undefined,
    expiration: undefined,
    messageId: eventId,
    timestamp: Math.floor(Date.now() / 1000),
    type: TaskEventType.Assigned,
    userId: undefined,
    appId: undefined,
    clusterId: undefined,
  };
}

test("parser accepts the exact versioned assignment event", () => {
  const parser = new TaskEventParser();
  const event = createEvent();
  const parsed = parser.parse(
    Buffer.from(JSON.stringify(event)),
    event.eventType,
    createProperties(event.eventId)
  );

  assert.deepEqual(parsed, event);
});

test("parser rejects extra event fields", () => {
  const parser = new TaskEventParser();
  const event = createEvent();
  const invalidEvent = { ...event, email: "not-allowed@example.com" };

  assert.throws(
    () =>
      parser.parse(
        Buffer.from(JSON.stringify(invalidEvent)),
        event.eventType,
        createProperties(event.eventId)
      ),
    InvalidTaskEventError
  );
});

test("parser rejects AMQP metadata that disagrees with the event", () => {
  const parser = new TaskEventParser();
  const event = createEvent();
  const properties = createProperties(event.eventId);
  properties.messageId = uuidV7();

  assert.throws(
    () =>
      parser.parse(
        Buffer.from(JSON.stringify(event)),
        event.eventType,
        properties
      ),
    InvalidTaskEventError
  );
});
