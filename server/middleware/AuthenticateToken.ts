import type { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import {
  AuthenticationError,
  AuthorizationError,
} from "../errors/ApplicationErrors";
import type { UserRepositoryPort } from "../ports/RepositoryPorts";
import type { TokenServicePort } from "../ports/ServicePorts";

@injectable()
class AuthenticateToken {
  constructor(
    @inject(DependencySymbols.TokenService)
    private readonly tokenService: TokenServicePort,
    @inject(DependencySymbols.UserRepository)
    private readonly userRepository: UserRepositoryPort
  ) {}

  readonly handle = async (
    request: Request,
    _response: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authorizationHeader = request.headers.authorization;
      const match = authorizationHeader?.match(/^Bearer ([^\s]+)$/);

      if (!match?.[1]) {
        throw new AuthenticationError("Authentication token is required.");
      }

      const userId = this.tokenService.verifyUserId(match[1]);
      const user = await this.userRepository.findById(userId);

      if (!user) {
        throw new AuthorizationError("Token user no longer exists.");
      }

      request.user = {
        userId: user.id,
        role: user.role,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

export default AuthenticateToken;
