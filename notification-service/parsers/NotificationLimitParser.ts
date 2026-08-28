import { injectable } from "inversify";

import { RequestValidationError } from "../errors/ApplicationErrors";
import type { NotificationLimitParserPort } from "../ports/InfrastructurePorts";

@injectable()
class NotificationLimitParser implements NotificationLimitParserPort {
  private static readonly defaultLimit = 20;
  private static readonly maximumLimit = 100;

  parse(value: unknown): number {
    if (value === undefined) {
      return NotificationLimitParser.defaultLimit;
    }

    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
      throw new RequestValidationError("Limit must be a positive integer.");
    }

    const limit = Number(value);

    if (
      !Number.isSafeInteger(limit) ||
      limit > NotificationLimitParser.maximumLimit
    ) {
      throw new RequestValidationError("Limit must be between 1 and 100.");
    }

    return limit;
  }
}

export default NotificationLimitParser;
