import type { MessageProperties } from "amqplib";
import { validate as isUuid, version as uuidVersion } from "uuid";

import {
  TaskEventType,
  type TaskEvent,
} from "../domain/TaskEvents";
import InvalidTaskEventError from "../errors/EventErrors";

class TaskEventParser {
  private static readonly maximumEventBytes = 20 * 1024;
  private static readonly fields = new Set([
    "schemaVersion",
    "eventId",
    "eventType",
    "producer",
    "occurredAt",
    "taskId",
    "title",
    "createdByUserId",
    "assignedToUserId",
  ]);

  parse(
    content: Buffer,
    routingKey: string,
    properties: MessageProperties
  ): TaskEvent {
    if (content.byteLength > TaskEventParser.maximumEventBytes) {
      throw new InvalidTaskEventError("Event exceeds the maximum size.");
    }

    if (properties.contentType !== "application/json") {
      throw new InvalidTaskEventError(
        "Event content type must be application/json."
      );
    }

    let value: unknown;

    try {
      value = JSON.parse(content.toString("utf8")) as unknown;
    } catch {
      throw new InvalidTaskEventError("Event body is not valid JSON.");
    }

    if (!this.isRecord(value)) {
      throw new InvalidTaskEventError("Event body must be a JSON object.");
    }

    this.requireExactFields(value);

    if (value.schemaVersion !== 1) {
      throw new InvalidTaskEventError("Unsupported event schema version.");
    }

    if (value.producer !== "todo-service") {
      throw new InvalidTaskEventError("Event producer is invalid.");
    }

    if (!this.isSupportedEventType(value.eventType)) {
      throw new InvalidTaskEventError("Event type is invalid.");
    }

    if (routingKey !== value.eventType) {
      throw new InvalidTaskEventError(
        "Event type does not match its routing key."
      );
    }

    if (properties.type !== value.eventType) {
      throw new InvalidTaskEventError(
        "Event type does not match its AMQP metadata."
      );
    }

    const eventId = value.eventId;

    if (
      typeof eventId !== "string" ||
      !isUuid(eventId) ||
      uuidVersion(eventId) !== 7
    ) {
      throw new InvalidTaskEventError("Event ID must be a UUIDv7 value.");
    }

    if (properties.messageId !== eventId) {
      throw new InvalidTaskEventError(
        "Event ID does not match its AMQP metadata."
      );
    }

    const taskId = value.taskId;

    if (
      typeof taskId !== "string" ||
      !isUuid(taskId) ||
      uuidVersion(taskId) !== 7
    ) {
      throw new InvalidTaskEventError("Task ID must be a UUIDv7 value.");
    }

    const occurredAt = value.occurredAt;

    if (!this.isIsoTimestamp(occurredAt)) {
      throw new InvalidTaskEventError(
        "Event occurrence time must be an ISO-8601 UTC timestamp."
      );
    }

    const title = value.title;

    if (
      typeof title !== "string" ||
      title.length === 0 ||
      title.length > 200 ||
      title.trim() !== title
    ) {
      throw new InvalidTaskEventError(
        "Task title must be non-empty trimmed text of at most 200 characters."
      );
    }

    const createdByUserId = value.createdByUserId;

    if (!this.isPositiveInteger(createdByUserId)) {
      throw new InvalidTaskEventError("Task creator ID is invalid.");
    }

    const common = {
      schemaVersion: 1 as const,
      eventId,
      producer: "todo-service" as const,
      occurredAt,
      taskId,
      title,
      createdByUserId,
    };

    if (value.eventType === TaskEventType.Assigned) {
      const assignedToUserId = value.assignedToUserId;

      if (!this.isPositiveInteger(assignedToUserId)) {
        throw new InvalidTaskEventError("Task assignee ID is invalid.");
      }

      return {
        ...common,
        eventType: TaskEventType.Assigned,
        assignedToUserId,
      };
    }

    const assignedToUserId = value.assignedToUserId;

    if (
      assignedToUserId !== null &&
      !this.isPositiveInteger(assignedToUserId)
    ) {
      throw new InvalidTaskEventError("Task assignee ID is invalid.");
    }

    return {
      ...common,
      eventType: TaskEventType.Created,
      assignedToUserId,
    };
  }

  private requireExactFields(value: Record<string, unknown>): void {
    const keys = Object.keys(value);

    if (
      keys.length !== TaskEventParser.fields.size ||
      keys.some((key) => !TaskEventParser.fields.has(key))
    ) {
      throw new InvalidTaskEventError(
        "Event fields do not match schema version 1."
      );
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }

  private isSupportedEventType(value: unknown): value is TaskEventType {
    return value === TaskEventType.Created || value === TaskEventType.Assigned;
  }

  private isPositiveInteger(value: unknown): value is number {
    return (
      Number.isSafeInteger(value) && typeof value === "number" && value > 0
    );
  }

  private isIsoTimestamp(value: unknown): value is string {
    if (typeof value !== "string") {
      return false;
    }

    const timestamp = Date.parse(value);

    return (
      Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
    );
  }
}

export default TaskEventParser;
