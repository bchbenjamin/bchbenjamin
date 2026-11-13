import "server-only";

import { asc, desc, eq } from "drizzle-orm";

import type { Item } from "@/lib/content/types";

import { getDb } from "./client";
import { bullet, item, itemSkill, itemUrl, profile, skill } from "./schema";

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

export async function getItemForAdmin(id: string): Promise<Item | null> {
  const db = getDb("admin");
  const rows = await db.select().from(item).where(eq(item.id, id)).limit(1);
  const row = rows[0];
  if (!row) return null;

  const [urls, bullets, skills] = await Promise.all([
    db
      .select({ label: itemUrl.label, url: itemUrl.url })
      .from(itemUrl)
      .where(eq(itemUrl.itemId, id))
      .orderBy(asc(itemUrl.displayOrder)),
    db
      .select({ body: bullet.body })
      .from(bullet)
      .where(eq(bullet.itemId, id))
      .orderBy(asc(bullet.displayOrder)),
    db
      .select({ name: skill.name })
      .from(itemSkill)
      .innerJoin(skill, eq(itemSkill.skillId, skill.id))
      .where(eq(itemSkill.itemId, id))
      .orderBy(asc(skill.name)),
  ]);

  return {
    id: row.id,
    slug: row.slug,
    type: row.type,
    title: row.title,
    org: row.org,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    descriptionLong: row.descriptionLong,
    summaryShort: row.summaryShort,
    displayOrder: row.displayOrder,
    isPublic: row.isPublic,
    resumeEligible: row.resumeEligible,
    announceOnLinkedIn: row.announceOnLinkedIn,
    isBeta: row.isBeta,
    urls: urls.map((link) => ({ label: link.label, url: link.url })),
    bullets: bullets.map((entry) => entry.body),
    skills: skills.map((entry) => entry.name),
  };
}

export async function getProfileRow() {
  const rows = await getDb("admin")
    .select()
    .from(profile)
    .orderBy(asc(profile.id))
    .limit(1);
  return rows[0] ?? null;
}
