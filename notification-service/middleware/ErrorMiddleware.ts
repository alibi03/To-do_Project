import type { ErrorRequestHandler, RequestHandler } from "express";
import { injectable } from "inversify";

import {
  ApplicationError,
  NotFoundError,
} from "../errors/ApplicationErrors";
import type { ErrorMiddlewarePort } from "../ports/InfrastructurePorts";

@injectable()
class ErrorMiddleware implements ErrorMiddlewarePort {
  readonly notFound: RequestHandler = (_request, _response, next) => {
    next(new NotFoundError());
  };

  readonly handle: ErrorRequestHandler = (
    error: unknown,
    _request,
    response,
    _next
  ) => {
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
  };
}

export default ErrorMiddleware;
