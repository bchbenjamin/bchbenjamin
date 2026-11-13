"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth, isOwnerEmail } from "@/lib/auth";
import { safeNextPath } from "@/lib/next-path";

export type SignInState = { error: string | null };

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));

  if (!email || !password) {
    return { error: "Email and password are both required." };
  }

  try {
    const result = await getAuth().api.signInEmail({
      body: { email, password },
      headers: await headers(),
    });

    if (!isOwnerEmail(result?.user?.email ?? email)) {
      return { error: "This account is not allowed to sign in." };
    }
  } catch {
    // Better Auth deliberately does not distinguish unknown email from wrong
    // password, and neither does this message.
    return { error: "Invalid email or password." };
  }

  redirect(next);
}
