import "server-only";

import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";

import { connectionStringFor, DB_ENV_VAR, type DbRole } from "./config";
import * as schema from "./schema";

/*
 * One pooled Neon connection per role. Pools are kept on globalThis so dev
 * hot-reload does not open a new pool on every edit.
 *
 * Requires a runtime with a global WebSocket (Node 22+), which is what Vercel
 * and the test environment provide.
 */

type DbCaches = {
  pools: Map<DbRole, Pool>;
  databases: Map<DbRole, NeonDatabase<typeof schema>>;
};

const globalForDb = globalThis as unknown as { __bchbenjaminDb?: DbCaches };

const caches: DbCaches = (globalForDb.__bchbenjaminDb ??= {
  pools: new Map(),
  databases: new Map(),
});

export function getPool(role: DbRole): Pool {
  const cached = caches.pools.get(role);
  if (cached) return cached;

  const connectionString = connectionStringFor(role);
  if (!connectionString) {
    throw new Error(
      `${DB_ENV_VAR[role]} is not set. Copy .env.example to .env.local and fill it in.`,
    );
  }

  const pool = new Pool({ connectionString });
  caches.pools.set(role, pool);
  return pool;
}

export function getDb(role: DbRole): NeonDatabase<typeof schema> {
  const cached = caches.databases.get(role);
  if (cached) return cached;

  const db = drizzle(getPool(role), { schema });
  caches.databases.set(role, db);
  return db;
}
