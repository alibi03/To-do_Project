import type { ErrorRequestHandler, RequestHandler } from "express";
import { injectable } from "inversify";

import {
  ApplicationError,
  NotFoundError,
} from "../errors/ApplicationErrors";

@injectable()
class ErrorMiddleware {
  readonly notFound: RequestHandler = (_request, _response, next) => {
    next(new NotFoundError("Route not found."));
  };

  readonly handle: ErrorRequestHandler = (
    error: Error,
    _request,
    response,
    next
  ) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    if (error instanceof ApplicationError) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }

    if (
      error instanceof SyntaxError &&
      "status" in error &&
      error.status === 400
    ) {
      response.status(400).json({
        message: "Request body contains invalid JSON.",
      });
      return;
    }

    console.error(error);
    response.status(500).json({
      message: "An unexpected server error occurred.",
    });
  };
}

export default ErrorMiddleware;
