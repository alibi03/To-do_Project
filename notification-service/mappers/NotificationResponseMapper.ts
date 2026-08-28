import { TaskEventType } from "../contracts/events/TaskEvents";
import type {
  NotificationRow,
} from "../models/repositories/NotificationModels";
import type NotificationResponse from "../models/responses/NotificationResponse";

class NotificationResponseMapper {
  static toResponse(row: NotificationRow): NotificationResponse {
    if (row.event_type !== TaskEventType.Assigned) {
      throw new Error("Only assignment notifications can be returned to a user.");
    }

    return {
      id: row.id,
      event_type: row.event_type,
      task_id: row.task_id,
      message: row.message,
      created_at: row.created_at.toISOString(),
      read_at: row.read_at?.toISOString() ?? null,
    };
  }
}

export default NotificationResponseMapper;
