import { Router } from "express";

import * as authController from "../controllers/authController";
import * as passwordResetController from "../controllers/passwordResetController";
import AsyncHandler from "../utils/AsyncHandler";
import RateLimiters from "../utils/RateLimiters";

const router = Router();

router.post(
  "/register",
  RateLimiters.authentication,
  AsyncHandler.wrap(authController.register)
);
router.post(
  "/login",
  RateLimiters.authentication,
  AsyncHandler.wrap(authController.login)
);
router.post(
  "/forgot-password",
  RateLimiters.passwordReset,
  AsyncHandler.wrap(passwordResetController.forgotPassword)
);
router.post(
  "/reset-password",
  RateLimiters.passwordReset,
  AsyncHandler.wrap(passwordResetController.resetPassword)
);

export default router;
