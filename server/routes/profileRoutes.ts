import { Router } from "express";

import * as profileController from "../controllers/profileController";
import authenticateToken from "../middleware/authenticateToken";
import AsyncHandler from "../utils/AsyncHandler";

const router = Router();

router.get(
  "/",
  authenticateToken,
  AsyncHandler.wrap(profileController.getProfile)
);

export default router;
