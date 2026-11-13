import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";

import { getDb } from "@/db/client";
import * as schema from "@/db/schema";

/*
 * Better Auth configuration.
 *
 * Sign-up is disabled in the running app: the owner account is created once by
 * `npm run auth:create-owner`. The same factory takes allowSignUp so that script
 * can reuse the configuration instead of duplicating it.
 *
 * Sessions are database sessions, so a revoked session takes effect immediately.
 * nextCookies() must stay last so server actions can set cookies.
 */
export function authOptions({ allowSignUp = false }: { allowSignUp?: boolean } = {}) {
  return {
    appName: "bchbenjamin.in",
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb("admin"), {
      provider: "pg",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowSignUp,
      minPasswordLength: 12,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
    },
    plugins: [nextCookies()],
  };
}

export type AuthOptions = ReturnType<typeof authOptions>;
