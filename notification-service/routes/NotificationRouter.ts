import { Router } from "express";
import { inject, injectable } from "inversify";

import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import type {
  AuthenticationMiddlewarePort,
  NotificationControllerPort,
  NotificationRouterPort,
} from "../ports/InfrastructurePorts";
import AsyncHandler from "../utils/AsyncHandler";

@injectable()
class NotificationRouter implements NotificationRouterPort {
  constructor(
    @inject(ServiceIdentifiers.AuthenticationMiddleware)
    private readonly authenticateToken: AuthenticationMiddlewarePort,
    @inject(ServiceIdentifiers.NotificationController)
    private readonly controller: NotificationControllerPort
  ) {}

  create(): Router {
    const router = Router();

    router.get(
      "/",
      this.authenticateToken.handle,
      AsyncHandler.wrap(this.controller.list)
    );

    return router;
  }
}

export default NotificationRouter;
