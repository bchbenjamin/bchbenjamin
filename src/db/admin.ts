import "server-only";

import { asc, desc } from "drizzle-orm";

import { getDb } from "./client";
import { item, profile } from "./schema";

/*
 * Owner-only reads through the app_admin role, which is the only role allowed
 * to see non-public items. Every caller must have passed requireOwner() first.
 */

export type AdminItemSummary = {
  id: string;
  slug: string;
  type: string;
  title: string;
  startDate: string;
  endDate: string | null;
  displayOrder: number;
  isPublic: boolean;
  resumeEligible: boolean;
};

export async function listItemSummaries(): Promise<AdminItemSummary[]> {
  return getDb("admin")
    .select({
      id: item.id,
      slug: item.slug,
      type: item.type,
      title: item.title,
      startDate: item.startDate,
      endDate: item.endDate,
      displayOrder: item.displayOrder,
      isPublic: item.isPublic,
      resumeEligible: item.resumeEligible,
    })
    .from(item)
    .orderBy(asc(item.displayOrder), desc(item.startDate));
}

export async function getProfileRow() {
  const rows = await getDb("admin")
    .select()
    .from(profile)
    .orderBy(asc(profile.id))
    .limit(1);
  return rows[0] ?? null;
}
