import "server-only";

import { sql } from "drizzle-orm";

import type { ResumeContent } from "@/lib/resume/build";

import { getDb, getPool } from "./client";
import { publishedResume } from "./schema";

/*
 * Published resume snapshots. The public page and the .docx download read the
 * app_read view public_resume; publishing writes through app_admin.
 */

export type PublishedResume = {
  version: number;
  body: ResumeContent;
  publishedAt: string;
};

export async function getPublishedResume(): Promise<PublishedResume | null> {
  const result = await getPool("app").query<{
    version: number;
    body: unknown;
    published_at: Date | string;
  }>("select version, body, published_at from public_resume limit 1");

  const row = result.rows[0];
  if (!row) return null;

  return {
    version: row.version,
    body: row.body as ResumeContent,
    publishedAt:
      row.published_at instanceof Date
        ? row.published_at.toISOString()
        : String(row.published_at),
  };
}

/** Marks the given snapshot current and retires the previous one. */
export async function publishResume(body: ResumeContent): Promise<number> {
  const db = getDb("admin");

  return db.transaction(async (tx) => {
    await tx.execute(sql`update published_resume set is_current = false where is_current`);

    const result = await tx.execute(sql`
      insert into published_resume (version, body, is_current)
      values (
        coalesce((select max(version) from published_resume), 0) + 1,
        ${JSON.stringify(body)}::jsonb,
        true
      )
      returning version
    `);

    const row = (result as unknown as { rows?: { version: number }[] }).rows?.[0];
    if (!row) throw new Error("Publishing the resume produced no row.");
    return row.version;
  });
}

export { publishedResume };
