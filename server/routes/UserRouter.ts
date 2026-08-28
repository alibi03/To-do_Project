import { Router } from "express";
import { inject, injectable } from "inversify";

import UserController from "../controllers/UserController";
import DependencySymbols from "../dependencyInjection/DependencySymbols";
import AuthenticateToken from "../middleware/AuthenticateToken";
import AsyncHandler from "../utils/AsyncHandler";

@injectable()
class UserRouter {
  constructor(
    @inject(DependencySymbols.AuthenticateToken)
    private readonly authenticateToken: AuthenticateToken,
    @inject(DependencySymbols.UserController)
    private readonly userController: UserController
  ) {}

  create(): Router {
    const router = Router();

    router.use(this.authenticateToken.handle);
    router.get("/", AsyncHandler.wrap(this.userController.list));

    return router;
  }
}

export default UserRouter;
