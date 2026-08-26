import pool from "../config/database";
import { PersistenceError } from "../errors/ApplicationErrors";

type DatabaseTimeRecord = {
  database_time: Date;
};

export class SystemRepository {
  async getDatabaseTime(): Promise<Date> {
    const result = await pool.query<DatabaseTimeRecord>(
      "SELECT NOW() AS database_time"
    );
    const row = result.rows[0];

    if (!row) {
      throw new PersistenceError("Database health query returned no result.");
    }

    return row.database_time;
  }
}

const systemRepository = new SystemRepository();

export default systemRepository;
