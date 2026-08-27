import jwt, { type SignOptions } from "jsonwebtoken";

import Environment from "../config/Environment";
import {
  AuthorizationError,
  ConfigurationError,
} from "../errors/ApplicationErrors";

type TokenLifetime = NonNullable<SignOptions["expiresIn"]>;

export class TokenService {
  private readonly supportedLifetimes = new Map<string, TokenLifetime>([
    ["15m", "15m"],
    ["30m", "30m"],
    ["1h", "1h"],
    ["2h", "2h"],
    ["1d", "1d"],
    ["7d", "7d"],
  ]);

  private getLifetime(): TokenLifetime {
    const configuredLifetime = Environment.jwtExpiresIn;
    const lifetime = this.supportedLifetimes.get(configuredLifetime);

    if (!lifetime) {
      throw new ConfigurationError("JWT_EXPIRES_IN is not supported.");
    }

    return lifetime;
  }

  create(userId: number): string {
    return jwt.sign({}, Environment.jwtSecret, {
      expiresIn: this.getLifetime(),
      subject: String(userId),
    });
  }

  verifyUserId(token: string): number {
    let payload: string | jwt.JwtPayload;

    try {
      payload = jwt.verify(token, Environment.jwtSecret, {
        algorithms: ["HS256"],
      });
    } catch {
      throw new AuthorizationError("Token is invalid or expired.");
    }

    if (typeof payload === "string" || typeof payload.sub !== "string") {
      throw new AuthorizationError("Token payload is invalid.");
    }

    const userId = Number(payload.sub);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new AuthorizationError("Token payload is invalid.");
    }

    return userId;
  }
}

const tokenService = new TokenService();

export default tokenService;
