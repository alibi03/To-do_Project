import type { ErrorRequestHandler, RequestHandler } from "express";

import {
  ApplicationError,
  NotFoundError,
} from "../errors/ApplicationErrors";
import MessageResponseModel from "../models/responses/MessageResponse";

const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new NotFoundError("Route not found."));
};

const errorHandler: ErrorRequestHandler = (
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
    response
      .status(error.statusCode)
      .json(new MessageResponseModel(error.message));
    return;
  }

  if (
    error instanceof SyntaxError &&
    "status" in error &&
    error.status === 400
  ) {
    response
      .status(400)
      .json(new MessageResponseModel("Request body contains invalid JSON."));
    return;
  }

  console.error(error);

  response
    .status(500)
    .json(new MessageResponseModel("An unexpected server error occurred."));
};

export { errorHandler, notFoundHandler };
