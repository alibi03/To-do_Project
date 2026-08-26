import { Pool } from "pg";
import Environment from "./Environment";

const pool = new Pool({
  host: Environment.databaseHost,
  port: Environment.databasePort,
  database: Environment.databaseName,
  user: Environment.databaseUser,
  password: Environment.databasePassword,
});

pool.on("error", (error) => {
  console.error("Unexpected PostgreSQL pool error.", error);
});

export default pool;
