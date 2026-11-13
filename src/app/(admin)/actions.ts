"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getAuth, requireOwner } from "@/lib/auth";

export async function signOutAction(): Promise<void> {
  await requireOwner();
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/login");
}
