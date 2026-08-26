import { ValidateIf } from "class-validator";

class ValidationDecorators {
  static optionalButNotNull(): PropertyDecorator {
    return ValidateIf((_object: object, value: unknown) => value !== undefined);
  }
}

export default ValidationDecorators;
