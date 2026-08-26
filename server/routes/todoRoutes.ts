import { Router } from "express";

import * as todoController from "../controllers/todoController";
import authenticateToken from "../middleware/authenticateToken";
import AsyncHandler from "../utils/AsyncHandler";

const router = Router();

router.use(authenticateToken);

router.get("/", AsyncHandler.wrap(todoController.list));
router.post("/", AsyncHandler.wrap(todoController.create));
router.patch("/:id", AsyncHandler.wrap(todoController.update));
router.delete("/:id", AsyncHandler.wrap(todoController.remove));

export default router;
