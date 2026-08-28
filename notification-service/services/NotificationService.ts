import { inject, injectable } from "inversify";

import {
  TaskEventType,
  type TaskEvent,
} from "../contracts/events/TaskEvents";
import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import NotificationResponseMapper from "../mappers/NotificationResponseMapper";
import type NotificationResponse from "../models/responses/NotificationResponse";
import type { IdGeneratorPort } from "../ports/InfrastructurePorts";
import type { NotificationRepositoryPort } from "../ports/RepositoryPorts";
import type { NotificationServicePort } from "../ports/ServicePorts";

@injectable()
class NotificationService implements NotificationServicePort {
  constructor(
    @inject(ServiceIdentifiers.NotificationRepository)
    private readonly repository: NotificationRepositoryPort,
    @inject(ServiceIdentifiers.IdGenerator)
    private readonly idGenerator: IdGeneratorPort
  ) {}

  async record(event: TaskEvent): Promise<void> {
    const recipientUserId =
      event.eventType === TaskEventType.Assigned
        ? event.assignedToUserId
        : null;
    const message =
      event.eventType === TaskEventType.Assigned
        ? `Task "${event.title}" was assigned to you.`
        : `Task "${event.title}" was created.`;

    await this.repository.insert({
      id: this.idGenerator.generate(),
      eventId: event.eventId,
      eventType: event.eventType,
      recipientUserId,
      taskId: event.taskId,
      message,
      createdAt: event.occurredAt,
    });
  }

  async listForUser(
    userId: number,
    limit: number
  ): Promise<NotificationResponse[]> {
    const rows = await this.repository.findAssignedToUser(userId, limit);
    return rows.map(NotificationResponseMapper.toResponse);
  }
}

export default NotificationService;
