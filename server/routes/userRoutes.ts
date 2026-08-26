import { Router } from "express";

import * as userController from "../controllers/userController";
import authenticateToken from "../middleware/authenticateToken";
import AsyncHandler from "../utils/AsyncHandler";

const router = Router();

router.use(authenticateToken);
router.get("/", AsyncHandler.wrap(userController.list));

export default router;
