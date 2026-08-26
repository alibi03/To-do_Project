import { rateLimit } from "express-rate-limit";

import MessageResponseModel from "../models/responses/MessageResponse";

class RateLimiters {
  private static readonly fifteenMinutes = 15 * 60 * 1000;

  static readonly authentication = rateLimit({
    windowMs: this.fifteenMinutes,
    limit: 20,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: new MessageResponseModel(
      "Too many authentication attempts. Please try again later."
    ),
  });

  static readonly passwordReset = rateLimit({
    windowMs: this.fifteenMinutes,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: new MessageResponseModel(
      "Too many password reset attempts. Please try again later."
    ),
  });
}

export default RateLimiters;
