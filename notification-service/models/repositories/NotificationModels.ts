import type { QueryResultRow } from "pg";

import type { TaskEventType } from "../../contracts/events/TaskEvents";

interface CreateNotificationModel {
  id: string;
  eventId: string;
  eventType: TaskEventType;
  recipientUserId: number | null;
  taskId: string;
  message: string;
  createdAt: string;
}

interface NotificationRow extends QueryResultRow {
  id: string;
  event_type: string;
  task_id: string;
  message: string;
  created_at: Date;
  read_at: Date | null;
}

export { type CreateNotificationModel, type NotificationRow };
