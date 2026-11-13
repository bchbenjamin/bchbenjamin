/*
 * Creates (or rotates) the two runtime roles and grants them exactly what they
 * need: app_read may select from the public views only, app_admin may write the
 * content tables.
 *
 * Passwords come from APP_READ_PASSWORD and APP_ADMIN_PASSWORD. They are sent to
 * the database as bind parameters and turned into SQL literals server-side with
 * quote_literal, so they never reach this process's output and cannot break out
 * of the statement.
 */
import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_MIGRATE;
const readPassword = process.env.APP_READ_PASSWORD;
const adminPassword = process.env.APP_ADMIN_PASSWORD;

if (!url || !readPassword || !adminPassword) {
  console.error(
    "DATABASE_URL_MIGRATE, APP_READ_PASSWORD and APP_ADMIN_PASSWORD must all be set.",
  );
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
try {
  const { rows } = await pool.query(
    "select quote_literal($1) as read_literal, quote_literal($2) as admin_literal",
    [readPassword, adminPassword],
  );
  const readLiteral = rows[0].read_literal;
  const adminLiteral = rows[0].admin_literal;

  await pool.query(`
    do $$
    begin
      if not exists (select 1 from pg_roles where rolname = 'app_read') then
        execute format('create role app_read login password %s', ${readLiteral});
      else
        execute format('alter role app_read with login password %s', ${readLiteral});
      end if;

      if not exists (select 1 from pg_roles where rolname = 'app_admin') then
        execute format('create role app_admin login password %s', ${adminLiteral});
      else
        execute format('alter role app_admin with login password %s', ${adminLiteral});
      end if;
    end
    $$;
  `);

  await pool.query("grant usage on schema public to app_read, app_admin");

  await pool.query(
    "revoke all on public.item, public.item_url, public.bullet, public.skill, public.item_skill, public.profile, public.published_resume, public.\"user\", public.session, public.account, public.verification from app_read",
  );
  await pool.query(
    "grant select on public.public_profile, public.public_item, public.public_skill, public.public_resume to app_read",
  );

  await pool.query(
    "grant select, insert, update, delete on public.profile, public.item, public.item_url, public.bullet, public.skill, public.item_skill, public.published_resume to app_admin",
  );
  await pool.query(
    "grant select on public.public_profile, public.public_item, public.public_skill, public.public_resume to app_admin",
  );

  console.log("roles ready: app_read (views only), app_admin (content tables)");
} finally {
  await pool.end();
}
