import { injectable } from "inversify";
import { v7 as uuidv7 } from "uuid";

import type { IdGeneratorPort } from "../ports/InfrastructurePorts";

@injectable()
class UuidGenerator implements IdGeneratorPort {
  generate(): string {
    return uuidv7();
  }
}

export default UuidGenerator;
