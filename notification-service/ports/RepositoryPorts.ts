import type {
  CreateNotificationModel,
  NotificationRow,
} from "../models/repositories/NotificationModels";

interface NotificationRepositoryPort {
  insert(model: CreateNotificationModel): Promise<void>;
  findAssignedToUser(
    recipientUserId: number,
    limit: number
  ): Promise<NotificationRow[]>;
}

export type { NotificationRepositoryPort };
