import type { TaskEvent } from "../contracts/events/TaskEvents";
import type { Express, RequestHandler } from "express";

interface ApplicationFactoryPort {
  create(): Express;
}

interface MigrationRunnerPort {
  run(): Promise<void>;
}

interface RateLimiterPort {
  readonly authentication: RequestHandler;
  readonly passwordReset: RequestHandler;
}

interface TaskEventFactoryPort {
  taskCreated(
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number
  ): TaskEvent;
  taskAssigned(
    taskId: string,
    title: string,
    createdByUserId: number,
    assignedToUserId: number
  ): TaskEvent;
}

interface TaskEventPublisherPort {
  publish(event: TaskEvent): Promise<void>;
  close(): Promise<void>;
}

interface UuidGeneratorPort {
  generateV7(): string;
}

interface TodoServerPort {
  start(): Promise<void>;
}

export {
  type ApplicationFactoryPort,
  type MigrationRunnerPort,
  type RateLimiterPort,
  type TaskEventFactoryPort,
  type TaskEventPublisherPort,
  type UuidGeneratorPort,
  type TodoServerPort,
};
