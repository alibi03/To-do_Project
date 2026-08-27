import jwt from "jsonwebtoken";

import Environment from "../config/Environment";
import { AuthenticationError } from "../errors/ApplicationErrors";

class TokenService {
  verifyUserId(token: string): number {
    let payload: string | jwt.JwtPayload;

    try {
      payload = jwt.verify(token, Environment.jwtSecret, {
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
