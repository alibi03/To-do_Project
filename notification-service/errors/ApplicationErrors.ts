class ApplicationError extends Error {
  constructor(
    readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

class AuthenticationError extends ApplicationError {
  constructor(message = "Authentication is required.") {
    super(401, message);
  }
}

class RequestValidationError extends ApplicationError {
  constructor(message: string) {
    super(400, message);
  }
}

class NotFoundError extends ApplicationError {
  constructor(message = "Route not found.") {
    super(404, message);
  }
}

export {
  ApplicationError,
  AuthenticationError,
  NotFoundError,
  RequestValidationError,
};
