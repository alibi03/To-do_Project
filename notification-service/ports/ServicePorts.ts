import type { TaskEvent } from "../contracts/events/TaskEvents";
import type NotificationResponse from "../models/responses/NotificationResponse";

interface NotificationServicePort {
  record(event: TaskEvent): Promise<void>;
  listForUser(userId: number, limit: number): Promise<NotificationResponse[]>;
}

interface TokenServicePort {
  verifyUserId(token: string): number;
}

export type { NotificationServicePort, TokenServicePort };
