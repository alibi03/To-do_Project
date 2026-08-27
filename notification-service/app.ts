import cors from "cors";
import express, { type Express } from "express";

import Environment from "./config/Environment";
import type NotificationController from "./controllers/NotificationController";
import type AuthenticateToken from "./middleware/AuthenticateToken";
import ErrorMiddleware from "./middleware/ErrorMiddleware";
import NotificationRouter from "./routes/NotificationRouter";

class ApplicationFactory {
  static create(
    authenticateToken: AuthenticateToken,
    notificationController: NotificationController
  ): Express {
    const app = express();

    app.disable("x-powered-by");
    app.use(
      cors({
        origin: Environment.clientOrigin,
      })
    );

    app.get("/api/health", (_request, response) => {
      response.json({ status: "ok" });
    });
    app.use(
      "/api/notifications",
      NotificationRouter.create(authenticateToken, notificationController)
    );

    app.use(ErrorMiddleware.notFound);
    app.use(ErrorMiddleware.handle);

    return app;
  }
}

export default ApplicationFactory;
