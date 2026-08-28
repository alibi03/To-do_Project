import { Router } from "express";
import { inject, injectable } from "inversify";

import ProfileController from "../controllers/ProfileController";
import DependencySymbols from "../dependencyInjection/DependencySymbols";
import AuthenticateToken from "../middleware/AuthenticateToken";
import AsyncHandler from "../utils/AsyncHandler";

@injectable()
class ProfileRouter {
  constructor(
    @inject(DependencySymbols.AuthenticateToken)
    private readonly authenticateToken: AuthenticateToken,
    @inject(DependencySymbols.ProfileController)
    private readonly profileController: ProfileController
  ) {}

  create(): Router {
    const router = Router();

    router.get(
      "/",
      this.authenticateToken.handle,
      AsyncHandler.wrap(this.profileController.getProfile)
    );

    return router;
  }
}

export default ProfileRouter;
