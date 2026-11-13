/*
 * Creates the single owner account, or resets its password.
 *
 * Sign-up is disabled in the app, so this is the only way an account appears.
 * It writes the same rows Better Auth's credential sign-in reads: a `user` row
 * and a `credential` account whose accountId is the user id, with the password
 * hashed by Better Auth's own hasher.
 *
 *   OWNER_EMAIL=... OWNER_PASSWORD=... npm run auth:create-owner
 */
import { randomUUID } from "node:crypto";

import { Pool } from "@neondatabase/serverless";
import { hashPassword } from "better-auth/crypto";

const url = process.env.DATABASE_URL_MIGRATE;
const email = process.env.OWNER_EMAIL?.trim().toLowerCase();
const password = process.env.OWNER_PASSWORD;

if (!url) {
  console.error("DATABASE_URL_MIGRATE is not set.");
  process.exit(1);
}
if (!email || !password) {
  console.error("OWNER_EMAIL and OWNER_PASSWORD must both be set.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("OWNER_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url });
const client = await pool.connect();

try {
  await client.query("begin");

  const existing = await client.query(
    'select id from "user" where email = $1',
    [email],
  );

  const hash = await hashPassword(password);

  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    const account = await client.query(
      "select id from account where user_id = $1 and provider_id = 'credential'",
      [userId],
    );
    if (account.rows.length > 0) {
      await client.query("update account set password = $1, updated_at = now() where id = $2", [
        hash,
        account.rows[0].id,
      ]);
    } else {
      await client.query(
        `insert into account (id, account_id, provider_id, user_id, password)
         values ($1, $2, 'credential', $3, $4)`,
        [randomUUID(), userId, userId, hash],
      );
    }
    await client.query(
      'update "user" set email_verified = true, updated_at = now() where id = $1',
      [userId],
    );
    console.log(`password reset for ${email}`);
  } else {
    const userId = randomUUID();
    await client.query(
      `insert into "user" (id, name, email, email_verified)
       values ($1, $2, $3, true)`,
      [userId, email.split("@")[0], email],
    );
    await client.query(
      `insert into account (id, account_id, provider_id, user_id, password)
       values ($1, $2, 'credential', $3, $4)`,
      [randomUUID(), userId, userId, hash],
    );
    console.log(`owner account created for ${email}`);
  }

  await client.query("commit");
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
