import "server-only";

import { betterAuth } from "better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { authOptions } from "./options";

/*
 * The auth instance is built on first use, not at import: importing this module
 * during `next build` must not require a database or a secret.
 */

function createAuth() {
  return betterAuth(authOptions());
}

type Auth = ReturnType<typeof createAuth>;

let cached: Auth | undefined;

export function getAuth(): Auth {
  return (cached ??= createAuth());
}

export type OwnerSession = NonNullable<
  Awaited<ReturnType<Auth["api"]["getSession"]>>
>;

/** The signed-in session, or null. Never trust the proxy's cookie check alone. */
export async function getOwnerSession(): Promise<OwnerSession | null> {
  return getAuth().api.getSession({ headers: await headers() });
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Not authorised");
    this.name = "UnauthorizedError";
  }
}

/**
 * Every admin route handler, server action and admin page calls this. It throws
 * rather than returning null so a forgotten check cannot become an open door.
 */
export async function requireOwner(): Promise<OwnerSession> {
  const session = await getOwnerSession();
  if (!session) throw new UnauthorizedError();
  if (!isOwnerEmail(session.user.email)) throw new UnauthorizedError();
  return session;
}

/** Same check, but for pages: a signed-out visitor goes to the login form. */
export async function requireOwnerPage(nextPath = "/admin"): Promise<OwnerSession> {
  const session = await getOwnerSession();
  if (!session || !isOwnerEmail(session.user.email)) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return session;
}

/**
 * The only account that can sign in. Sign-up is disabled, so with OWNER_EMAIL
 * unset the single existing account is the owner; when it is set, a session for
 * any other address is refused as well.
 */
export function isOwnerEmail(
  email: string | null | undefined,
  ownerEmail: string | undefined = process.env.OWNER_EMAIL,
): boolean {
  if (!email) return false;
  const configured = ownerEmail?.trim().toLowerCase();
  if (!configured) return true;
  return email.trim().toLowerCase() === configured;
}
