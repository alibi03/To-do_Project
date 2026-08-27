import type { PoolClient } from "pg";

interface Migration {
  readonly name: string;
  up(client: PoolClient): Promise<void>;
}

export default Migration;
