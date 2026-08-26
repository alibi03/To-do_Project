import { plainToInstance, type ClassConstructor } from "class-transformer";
import {
  validate,
  type ValidationError as ClassValidationError,
} from "class-validator";

import { ValidationError } from "../errors/ApplicationErrors";

class RequestValidator {
  private static collectMessages(errors: ClassValidationError[]): string[] {
    return errors.flatMap((error) => [
      ...Object.values(error.constraints ?? {}),
      ...this.collectMessages(error.children ?? []),
    ]);
  }

  static async validate<T extends object>(
    dtoClass: ClassConstructor<T>,
    value: unknown
  ): Promise<T> {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      throw new ValidationError("Request data must be an object.");
    }

    const dto = plainToInstance(dtoClass, value);
    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      stopAtFirstError: true,
      validationError: {
        target: false,
        value: false,
      },
    });

    if (errors.length > 0) {
      throw new ValidationError(
        this.collectMessages(errors)[0] ?? "Request validation failed."
      );
    }

    return dto;
  }
}

export default RequestValidator;
