abstract class ApplicationError extends Error {
  readonly statusCode: number;

  protected constructor(name: string, statusCode: number, message: string) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }
}

class ValidationError extends ApplicationError {
  constructor(message: string) {
    super("ValidationError", 400, message);
  }
}

class AuthenticationError extends ApplicationError {
  constructor(message: string) {
    super("AuthenticationError", 401, message);
  }
}

class AuthorizationError extends ApplicationError {
  constructor(message: string) {
    super("AuthorizationError", 403, message);
  }
}

class NotFoundError extends ApplicationError {
  constructor(message: string) {
    super("NotFoundError", 404, message);
  }
}

class ConflictError extends ApplicationError {
  constructor(message: string) {
    super("ConflictError", 409, message);
  }
}

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}

class PersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PersistenceError";
  }
}

class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConcurrencyError";
  }
}

export {
  ApplicationError,
  AuthenticationError,
  AuthorizationError,
  ConfigurationError,
  ConcurrencyError,
  ConflictError,
  NotFoundError,
  PersistenceError,
  ValidationError,
};
