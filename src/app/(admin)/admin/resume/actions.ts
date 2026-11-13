"use server";

import { revalidatePath } from "next/cache";

import { requireOwner } from "@/lib/auth";
import { getSiteContent } from "@/content/repository";
import { isDatabaseConfigured } from "@/db/config";
import { publishResume } from "@/db/resume";
import { buildResume } from "@/lib/resume/build";

export type PublishState = { message: string; ok: boolean };

export async function publishResumeAction(): Promise<PublishState> {
  await requireOwner();

  if (!isDatabaseConfigured()) {
    return { ok: false, message: "DATABASE_URL_APP is not set." };
  }

  try {
    const version = await publishResume(buildResume(await getSiteContent()));
    revalidatePath("/resume");
    revalidatePath("/resume", "page");
    return { ok: true, message: `Published resume version ${version}.` };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? `Could not publish: ${error.message}`
          : "Could not publish the resume.",
    };
  }
}
