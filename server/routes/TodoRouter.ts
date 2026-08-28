import { Router } from "express";
import { inject, injectable } from "inversify";

import TodoController from "../controllers/TodoController";
import DependencySymbols from "../dependencyInjection/DependencySymbols";
import AuthenticateToken from "../middleware/AuthenticateToken";
import AsyncHandler from "../utils/AsyncHandler";

@injectable()
class TodoRouter {
  constructor(
    @inject(DependencySymbols.AuthenticateToken)
    private readonly authenticateToken: AuthenticateToken,
    @inject(DependencySymbols.TodoController)
    private readonly todoController: TodoController
  ) {}

  create(): Router {
    const router = Router();

    router.use(this.authenticateToken.handle);
    router.get("/", AsyncHandler.wrap(this.todoController.list));
    router.post("/", AsyncHandler.wrap(this.todoController.create));
    router.patch("/:id", AsyncHandler.wrap(this.todoController.update));
    router.delete("/:id", AsyncHandler.wrap(this.todoController.remove));

    return router;
  }
}

export default TodoRouter;
