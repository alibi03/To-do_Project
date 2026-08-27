import type { NextFunction, Request, Response } from "express";

import { AuthenticationError } from "../errors/ApplicationErrors";
import type TokenService from "../services/TokenService";

class AuthenticateToken {
  constructor(private readonly tokenService: TokenService) {}

  readonly handle = (
    request: Request,
    _response: Response,
    next: NextFunction
  ): void => {
    try {
      const authorizationHeader = request.headers.authorization;
      const match = authorizationHeader?.match(/^Bearer ([^\s]+)$/);

      if (!match?.[1]) {
        throw new AuthenticationError("Authentication token is required.");
      }

      request.authenticatedUserId = this.tokenService.verifyUserId(match[1]);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export default AuthenticateToken;
