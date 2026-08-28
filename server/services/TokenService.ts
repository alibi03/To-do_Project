import { inject, injectable } from "inversify";
import jwt, { type SignOptions } from "jsonwebtoken";

import type { ApplicationConfig } from "../config/ApplicationConfig";
import DependencySymbols from "../dependencyInjection/DependencySymbols";
import {
  AuthorizationError,
  ConfigurationError,
} from "../errors/ApplicationErrors";
import type { TokenServicePort } from "../ports/ServicePorts";

type TokenLifetime = NonNullable<SignOptions["expiresIn"]>;

@injectable()
class TokenService implements TokenServicePort {
  private readonly supportedLifetimes = new Map<string, TokenLifetime>([
    ["15m", "15m"],
    ["30m", "30m"],
    ["1h", "1h"],
    ["2h", "2h"],
    ["1d", "1d"],
    ["7d", "7d"],
  ]);

  constructor(
    @inject(DependencySymbols.ApplicationConfig)
    private readonly config: ApplicationConfig
  ) {}

  create(userId: number): string {
    return jwt.sign({}, this.config.jwt.secret, {
      expiresIn: this.getLifetime(),
      subject: String(userId),
    });
  }

  verifyUserId(token: string): number {
    let payload: string | jwt.JwtPayload;

    try {
      payload = jwt.verify(token, this.config.jwt.secret, {
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

  private getLifetime(): TokenLifetime {
    const lifetime = this.supportedLifetimes.get(this.config.jwt.expiresIn);

    if (!lifetime) {
      throw new ConfigurationError("JWT_EXPIRES_IN is not supported.");
    }

    return lifetime;
  }
}

export default TokenService;
