import type { TransformFnParams } from "class-transformer";

type TransformableValue = string | number | boolean | object | null | undefined;

class StringTransformer {
  static trim({ value }: TransformFnParams): TransformableValue {
    if (typeof value === "string") {
      return value.trim();
    }

    if (
      typeof value === "number" ||
      typeof value === "boolean" ||
      typeof value === "undefined" ||
      value === null ||
      typeof value === "object"
    ) {
      return value;
    }

    return undefined;
  }
}

export default StringTransformer;
