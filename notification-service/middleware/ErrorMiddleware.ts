import type { NextFunction, Request, Response } from "express";

import {
  ApplicationError,
  NotFoundError,
} from "../errors/ApplicationErrors";

class ErrorMiddleware {
  static notFound(
    _request: Request,
    _response: Response,
    next: NextFunction
  ): void {
    next(new NotFoundError());
  }

  static handle(
    error: unknown,
    _request: Request,
    response: Response,
    _next: NextFunction
  ): void {
    if (error instanceof ApplicationError) {
      response.status(error.statusCode).json({
        message: error.message,
      });
      return;
    }

    console.error("Unhandled notification service error.", error);
    response.status(500).json({
      message: "An unexpected error occurred.",
    });
  }
}

export default ErrorMiddleware;
