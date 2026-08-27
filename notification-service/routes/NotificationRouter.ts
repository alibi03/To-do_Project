import { Router } from "express";

import type NotificationController from "../controllers/NotificationController";
import type AuthenticateToken from "../middleware/AuthenticateToken";
import AsyncHandler from "../utils/AsyncHandler";

class NotificationRouter {
  static create(
    authenticateToken: AuthenticateToken,
    controller: NotificationController
  ): Router {
    const router = Router();

    router.get(
      "/",
      authenticateToken.handle,
      AsyncHandler.wrap(controller.list)
    );

    return router;
  }
}

export default NotificationRouter;
