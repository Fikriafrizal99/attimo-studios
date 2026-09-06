import { Pool, type PoolClient } from "pg";

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production";

if (isProduction && !connectionString) {
  throw new Error("DATABASE_URL is required in production.");
}

type GlobalWithDbPool = typeof globalThis & {
  __attimoDbPool?: Pool;
};

const globalForDb = globalThis as GlobalWithDbPool;

export const dbPool = connectionString
  ? globalForDb.__attimoDbPool ?? new Pool({ connectionString })
  : undefined;

if (process.env.NODE_ENV !== "production" && dbPool) {
  globalForDb.__attimoDbPool = dbPool;
}

export type TenantDbClient = PoolClient;

export function requireDbPool(): Pool {
  if (!dbPool) {
    throw new Error("DATABASE_URL is required for database access.");
  }
  return dbPool;
}

/**
 * Run dashboard/database work as PostgreSQL role `authenticated` with a
 * transaction-scoped Better Auth user id. RLS policies consume this context.
 *
 * SET LOCAL is intentionally used so identity and role cannot leak when a
 * pooled connection is returned to the pool.
 */
export async function withTenantDb<T>(
  userId: string,
  fn: (client: TenantDbClient) => Promise<T>
): Promise<T> {
  if (!userId) throw new Error("Better Auth user id is required for tenant database access.");

  const client = await requireDbPool().connect();
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL ROLE authenticated");
    await client.query("SELECT set_config('app.better_auth_user_id', $1, true)", [userId]);

    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch (rollbackError) {
      console.error("Failed to rollback tenant database transaction", rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
