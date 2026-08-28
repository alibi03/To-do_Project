import { injectable } from "inversify";
import { v7 as uuidV7 } from "uuid";

import type { UuidGeneratorPort } from "../ports/InfrastructurePorts";

@injectable()
class UuidGenerator implements UuidGeneratorPort {
  generateV7(): string {
    return uuidV7();
  }
}

export default UuidGenerator;
