import type { QueryResultRow } from "pg";

import type { TaskEventType } from "../domain/TaskEvents";

class CreateNotificationModel {
  constructor(
    readonly id: string,
    readonly eventId: string,
    readonly eventType: TaskEventType,
    readonly recipientUserId: number | null,
    readonly taskId: string,
    readonly message: string,
    readonly createdAt: string
  ) {}
}

interface NotificationRow extends QueryResultRow {
  id: string;
  event_type: string;
  task_id: string;
  message: string;
  created_at: Date;
  read_at: Date | null;
}

interface NotificationResponseModel {
  id: string;
  event_type: "task.assigned.v1";
  task_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export {
  CreateNotificationModel,
  type NotificationResponseModel,
  type NotificationRow,
};
