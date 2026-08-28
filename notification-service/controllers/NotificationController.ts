import type { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";

import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import { AuthenticationError } from "../errors/ApplicationErrors";
import type { NotificationListResponse } from "../models/responses/NotificationResponse";
import type {
  NotificationControllerPort,
  NotificationLimitParserPort,
} from "../ports/InfrastructurePorts";
import type { NotificationServicePort } from "../ports/ServicePorts";

@injectable()
class NotificationController implements NotificationControllerPort {
  constructor(
    @inject(ServiceIdentifiers.NotificationService)
    private readonly service: NotificationServicePort,
    @inject(ServiceIdentifiers.NotificationLimitParser)
    private readonly limitParser: NotificationLimitParserPort
  ) {}

  readonly list = async (
    request: Request,
    response: Response<NotificationListResponse>,
    _next: NextFunction
  ): Promise<Response<NotificationListResponse>> => {
    const userId = request.authenticatedUserId;

    if (!Number.isSafeInteger(userId) || userId === undefined || userId <= 0) {
      throw new AuthenticationError();
    }

    const limit = this.limitParser.parse(request.query.limit);
    const notifications = await this.service.listForUser(userId, limit);

    return response.json({ notifications });
  };
}

export default NotificationController;
