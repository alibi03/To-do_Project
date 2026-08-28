import { inject, injectable } from "inversify";
import type { Pool } from "pg";

import DependencySymbols from "../dependencyInjection/DependencySymbols";
import { PersistenceError } from "../errors/ApplicationErrors";
import type { SystemRepositoryPort } from "../ports/RepositoryPorts";

type DatabaseTimeRecord = {
  database_time: Date;
};

@injectable()
export class SystemRepository implements SystemRepositoryPort {
  constructor(
    @inject(DependencySymbols.Pool) private readonly pool: Pool
  ) {}

  async getDatabaseTime(): Promise<Date> {
    const result = await this.pool.query<DatabaseTimeRecord>(
      "SELECT NOW() AS database_time"
    );
    const row = result.rows[0];

    if (!row) {
      throw new PersistenceError("Database health query returned no result.");
    }

    return row.database_time;
  }
}

export default SystemRepository;
