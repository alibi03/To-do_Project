import { Router } from "express";
import { inject, injectable } from "inversify";

import AuthController from "../controllers/AuthController";
import PasswordResetController from "../controllers/PasswordResetController";
import DependencySymbols from "../dependencyInjection/DependencySymbols";
import type { RateLimiterPort } from "../ports/InfrastructurePorts";
import AsyncHandler from "../utils/AsyncHandler";

@injectable()
class AuthRouter {
  constructor(
    @inject(DependencySymbols.AuthController)
    private readonly authController: AuthController,
    @inject(DependencySymbols.PasswordResetController)
    private readonly passwordResetController: PasswordResetController,
    @inject(DependencySymbols.RateLimiters)
    private readonly rateLimiters: RateLimiterPort
  ) {}

  create(): Router {
    const router = Router();

    router.post(
      "/register",
      this.rateLimiters.authentication,
      AsyncHandler.wrap(this.authController.register)
    );
    router.post(
      "/login",
      this.rateLimiters.authentication,
      AsyncHandler.wrap(this.authController.login)
    );
    router.post(
      "/forgot-password",
      this.rateLimiters.passwordReset,
      AsyncHandler.wrap(this.passwordResetController.forgotPassword)
    );
    router.post(
      "/reset-password",
      this.rateLimiters.passwordReset,
      AsyncHandler.wrap(this.passwordResetController.resetPassword)
    );

    return router;
  }
}

export default AuthRouter;
