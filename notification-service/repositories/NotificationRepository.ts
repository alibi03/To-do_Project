import type { Pool } from "pg";

import { TaskEventType } from "../domain/TaskEvents";
import {
  type NotificationRow,
  type CreateNotificationModel,
} from "../models/NotificationModels";

class NotificationRepository {
  constructor(private readonly pool: Pool) {}

  async insert(model: CreateNotificationModel): Promise<void> {
    await this.pool.query(
      `INSERT INTO notifications
        (id, event_id, event_type, recipient_user_id, task_id, message, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (event_id) DO NOTHING`,
      [
        model.id,
        model.eventId,
        model.eventType,
        model.recipientUserId,
        model.taskId,
        model.message,
        model.createdAt,
      ]
    );
  }

  async findAssignedToUser(
    recipientUserId: number,
    limit: number
  ): Promise<NotificationRow[]> {
    const result = await this.pool.query<NotificationRow>(
      `SELECT id, event_type, task_id, message, created_at, read_at
       FROM notifications
       WHERE recipient_user_id = $1
         AND event_type = $2
       ORDER BY created_at DESC, id DESC
       LIMIT $3`,
      [recipientUserId, TaskEventType.Assigned, limit]
    );

    return result.rows;
  }
}

export default NotificationRepository;
