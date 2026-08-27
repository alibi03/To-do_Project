import { Pool } from "pg";

import Environment from "./Environment";

class Database {
  readonly pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: Environment.databaseHost,
      port: Environment.databasePort,
      database: Environment.databaseName,
      user: Environment.databaseUser,
      password: Environment.databasePassword,
    });

    this.pool.on("error", (error) => {
      console.error("Unexpected notification database pool error.", error);
    });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

export default Database;
