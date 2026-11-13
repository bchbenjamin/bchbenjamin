/*
 * Applies drizzle/sql/*.sql to the database as the migrate role.
 *
 * Run after `drizzle-kit migrate` (npm run db:migrate does both). The files are
 * idempotent: they create or replace views, so re-running is safe.
 */
import { readdir, readFile } from "node:fs/promises";

import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_MIGRATE;
if (!url) {
  console.error("DATABASE_URL_MIGRATE is not set.");
  process.exit(1);
}

const dir = new URL("../drizzle/sql/", import.meta.url);
const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();

const pool = new Pool({ connectionString: url });
try {
  for (const file of files) {
    const body = await readFile(new URL(file, dir), "utf8");
    await pool.query(body);
    console.log(`applied ${file}`);
  }
  console.log(`done: ${files.length} sql file(s)`);
} finally {
  await pool.end();
}
