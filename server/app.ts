import cors from "cors";
import express, { type Express } from "express";
import { inject, injectable } from "inversify";

import type { ApplicationConfig } from "./config/ApplicationConfig";
import HealthController from "./controllers/HealthController";
import DependencySymbols from "./dependencyInjection/DependencySymbols";
import ErrorMiddleware from "./middleware/ErrorMiddleware";
import type { ApplicationFactoryPort } from "./ports/InfrastructurePorts";
import AuthRouter from "./routes/AuthRouter";
import ProfileRouter from "./routes/ProfileRouter";
import TodoRouter from "./routes/TodoRouter";
import UserRouter from "./routes/UserRouter";
import AsyncHandler from "./utils/AsyncHandler";

@injectable()
class ApplicationFactory implements ApplicationFactoryPort {
  constructor(
    @inject(DependencySymbols.ApplicationConfig)
    private readonly config: ApplicationConfig,
    @inject(DependencySymbols.HealthController)
    private readonly healthController: HealthController,
    @inject(DependencySymbols.AuthRouter)
    private readonly authRouter: AuthRouter,
    @inject(DependencySymbols.ProfileRouter)
    private readonly profileRouter: ProfileRouter,
    @inject(DependencySymbols.TodoRouter)
    private readonly todoRouter: TodoRouter,
    @inject(DependencySymbols.UserRouter)
    private readonly userRouter: UserRouter,
    @inject(DependencySymbols.ErrorMiddleware)
    private readonly errorMiddleware: ErrorMiddleware
  ) {}

  create(): Express {
    const app = express();

    app.disable("x-powered-by");
    app.use(
      cors({
        origin: this.config.clientOrigin,
      })
    );
    app.use(express.json({ limit: "20kb" }));

    app.get("/", (_request, response) => {
      response.send("Staj App server is running!");
    });
    app.get(
      "/api/health",
      AsyncHandler.wrap(this.healthController.getStatus)
    );

    app.use("/api/auth", this.authRouter.create());
    app.use("/api/profile", this.profileRouter.create());
    app.use("/api/todos", this.todoRouter.create());
    app.use("/api/users", this.userRouter.create());

    app.use(this.errorMiddleware.notFound);
    app.use(this.errorMiddleware.handle);

    return app;
  }
}

export default ApplicationFactory;
