import type { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";

import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import { AuthenticationError } from "../errors/ApplicationErrors";
import type { AuthenticationMiddlewarePort } from "../ports/InfrastructurePorts";
import type { TokenServicePort } from "../ports/ServicePorts";

@injectable()
class AuthenticateToken implements AuthenticationMiddlewarePort {
  constructor(
    @inject(ServiceIdentifiers.TokenService)
    private readonly tokenService: TokenServicePort
  ) {}

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
