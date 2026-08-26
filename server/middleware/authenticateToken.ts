import type { NextFunction, Request, Response } from "express";

import {
  AuthenticationError,
  AuthorizationError,
} from "../errors/ApplicationErrors";
import userRepository from "../repositories/UserRepository";
import tokenService from "../services/TokenService";

async function authenticateToken(
  request: Request,
  _response: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authorizationHeader = request.headers.authorization;
    const [scheme, token] = authorizationHeader?.split(" ") ?? [];

    if (scheme !== "Bearer" || !token) {
      throw new AuthenticationError("Authentication token is required.");
    }

    const userId = tokenService.verifyUserId(token);
    const user = await userRepository.findById(userId);

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
}

export default authenticateToken;
