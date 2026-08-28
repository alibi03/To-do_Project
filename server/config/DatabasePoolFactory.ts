import { Pool } from "pg";

import type { DatabaseConfig } from "./ApplicationConfig";

class DatabasePoolFactory {
  static create(config: DatabaseConfig): Pool {
    const pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.name,
      user: config.user,
      password: config.password,
    });

    pool.on("error", (error) => {
      console.error("Unexpected PostgreSQL pool error.", error);
    });

    return pool;
  }
}

export default DatabasePoolFactory;
