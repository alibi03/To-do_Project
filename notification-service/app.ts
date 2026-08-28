import cors from "cors";
import express, { type Express } from "express";
import { inject, injectable } from "inversify";

import type { NotificationConfig } from "./config/NotificationConfig";
import ServiceIdentifiers from "./dependencyInjection/ServiceIdentifiers";
import type {
  ApplicationFactoryPort,
  ErrorMiddlewarePort,
  HealthControllerPort,
  NotificationRouterPort,
} from "./ports/InfrastructurePorts";
import AsyncHandler from "./utils/AsyncHandler";

@injectable()
class ApplicationFactory implements ApplicationFactoryPort {
  constructor(
    @inject(ServiceIdentifiers.Config)
    private readonly config: NotificationConfig,
    @inject(ServiceIdentifiers.HealthController)
    private readonly healthController: HealthControllerPort,
    @inject(ServiceIdentifiers.NotificationRouter)
    private readonly notificationRouter: NotificationRouterPort,
    @inject(ServiceIdentifiers.ErrorMiddleware)
    private readonly errorMiddleware: ErrorMiddlewarePort
  ) {}

  create(): Express {
    const app = express();

    app.disable("x-powered-by");
    app.use(
      cors({
        origin: this.config.clientOrigin,
      })
    );

    app.get(
      "/api/health",
      AsyncHandler.wrap(this.healthController.getStatus)
    );
    app.use(
      "/api/notifications",
      this.notificationRouter.create()
    );

    app.use(this.errorMiddleware.notFound);
    app.use(this.errorMiddleware.handle);

    return app;
  }
}

export default ApplicationFactory;
