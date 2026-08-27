import type { NextFunction, Request, Response } from "express";

import { AuthenticationError } from "../errors/ApplicationErrors";
import type NotificationLimitParser from "../parsers/NotificationLimitParser";
import type NotificationService from "../services/NotificationService";

class NotificationController {
  constructor(
    private readonly service: NotificationService,
    private readonly limitParser: NotificationLimitParser
  ) {}

  readonly list = async (
    request: Request,
    response: Response,
    _next: NextFunction
  ): Promise<void> => {
    const userId = request.authenticatedUserId;

    if (!Number.isSafeInteger(userId) || userId === undefined || userId <= 0) {
      throw new AuthenticationError();
    }

    const limit = this.limitParser.parse(request.query.limit);
    const notifications = await this.service.listForUser(userId, limit);

    response.json({ notifications });
  };
}

export default NotificationController;
