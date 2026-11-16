import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  var rentRoomsPool: Pool | undefined;
}

const pool =
  globalThis.rentRoomsPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.VERCEL ? 1 : 5,
  });

if (process.env.NODE_ENV !== "production") globalThis.rentRoomsPool = pool;

function assertDatabaseConfigured(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error("Supabase database is not configured. Add its Postgres connection string as DATABASE_URL in .env.local.");
  }
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values: unknown[] = [],
) {
  assertDatabaseConfigured();
  return pool.query<T>(text, values);
}

export async function transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
  assertDatabaseConfigured();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
