/*
 * Environment lookups for the three database roles. Pure functions, no
 * connections, so they are safe to unit test and to import from anywhere.
 */

export type DbRole = "app" | "admin" | "migrate";

export const DB_ENV_VAR: Record<DbRole, string> = {
  app: "DATABASE_URL_APP",
  admin: "DATABASE_URL_ADMIN",
  migrate: "DATABASE_URL_MIGRATE",
};

/** What the helpers need from the environment: a name in, a string out. */
export type EnvLookup = Record<string, string | undefined>;

export function connectionStringFor(
  role: DbRole,
  env: EnvLookup = process.env,
): string | undefined {
  const value = env[DB_ENV_VAR[role]];
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return value.trim();
}

/**
 * The public site reads through the app_read role. Until that connection
 * string exists (CI, a fresh clone) the content layer falls back to the
 * checked-in JSON, so the site still builds and runs.
 */
export function isDatabaseConfigured(env: EnvLookup = process.env): boolean {
  return connectionStringFor("app", env) !== undefined;
}
