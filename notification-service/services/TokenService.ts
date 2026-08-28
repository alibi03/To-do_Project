import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";

import type { NotificationConfig } from "../config/NotificationConfig";
import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import { AuthenticationError } from "../errors/ApplicationErrors";
import type { TokenServicePort } from "../ports/ServicePorts";

@injectable()
class TokenService implements TokenServicePort {
  constructor(
    @inject(ServiceIdentifiers.Config)
    private readonly config: NotificationConfig
  ) {}

  verifyUserId(token: string): number {
    let payload: string | jwt.JwtPayload;

    try {
      payload = jwt.verify(token, this.config.jwtSecret, {
        algorithms: ["HS256"],
      });
    } catch {
      throw new AuthenticationError("Token is invalid or expired.");
    }

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new AuthenticationError("Token payload is invalid.");
    }

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new AuthenticationError("Token payload is invalid.");
    }

    return userId;
  }
}

export default TokenService;
