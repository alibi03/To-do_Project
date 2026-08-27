import { v7 as uuidv7 } from "uuid";

import { TaskEventType, type TaskEvent } from "../domain/TaskEvents";
import NotificationResponseMapper from "../mappers/NotificationResponseMapper";
import { CreateNotificationModel } from "../models/NotificationModels";
import type { NotificationResponseModel } from "../models/NotificationModels";
import type NotificationRepository from "../repositories/NotificationRepository";

class NotificationService {
  constructor(private readonly repository: NotificationRepository) {}

  async record(event: TaskEvent): Promise<void> {
    const recipientUserId =
      event.eventType === TaskEventType.Assigned
        ? event.assignedToUserId
        : null;
    const message =
      event.eventType === TaskEventType.Assigned
        ? `Task "${event.title}" was assigned to you.`
        : `Task "${event.title}" was created.`;

    await this.repository.insert(
      new CreateNotificationModel(
        uuidv7(),
        event.eventId,
        event.eventType,
        recipientUserId,
        event.taskId,
        message,
        event.occurredAt
      )
    );
  }

  async listForUser(
    userId: number,
    limit: number
  ): Promise<NotificationResponseModel[]> {
    const rows = await this.repository.findAssignedToUser(userId, limit);
    return rows.map(NotificationResponseMapper.toResponse);
  }
}

export default NotificationService;
