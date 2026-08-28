import { Pool } from "pg";
import { inject, injectable } from "inversify";

import ServiceIdentifiers from "../dependencyInjection/ServiceIdentifiers";
import type { DatabasePort } from "../ports/InfrastructurePorts";

@injectable()
class Database implements DatabasePort {
  constructor(
    @inject(ServiceIdentifiers.DatabasePool)
    private readonly pool: Pool
  ) {}

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default Database;
