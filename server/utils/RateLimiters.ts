import type { RequestHandler } from "express";
import { rateLimit } from "express-rate-limit";
import { injectable } from "inversify";

import type { RateLimiterPort } from "../ports/InfrastructurePorts";

@injectable()
class RateLimiters implements RateLimiterPort {
  readonly authentication: RequestHandler;
  readonly passwordReset: RequestHandler;

  constructor() {
    const fifteenMinutes = 15 * 60 * 1000;

    this.authentication = rateLimit({
      windowMs: fifteenMinutes,
      limit: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message: "Too many authentication attempts. Please try again later.",
      },
    });

    this.passwordReset = rateLimit({
      windowMs: fifteenMinutes,
      limit: 10,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: {
        message: "Too many password reset attempts. Please try again later.",
      },
    });
  }
}

export default RateLimiters;
