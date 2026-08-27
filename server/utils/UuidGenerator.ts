import { v7 as uuidV7 } from "uuid";

class UuidGenerator {
  static generateV7(): string {
    return uuidV7();
  }
}

export default UuidGenerator;
