import "server-only";

import { eq, sql } from "drizzle-orm";

import type { Item } from "@/lib/content/types";

import { getDb } from "./client";
import { bullet, item, itemSkill, itemUrl, skill } from "./schema";

/*
 * Content writes. Only app_admin may write, and every caller has already passed
 * requireOwner(). Each save runs in one transaction so an item never exists
 * with a half-replaced set of links or bullets.
 */

function itemValues(entry: Item) {
  return {
    slug: entry.slug,
    type: entry.type,
    title: entry.title,
    org: entry.org,
    location: entry.location,
    startDate: entry.startDate,
    endDate: entry.endDate,
    descriptionLong: entry.descriptionLong,
    summaryShort: entry.summaryShort,
    displayOrder: entry.displayOrder,
    isPublic: entry.isPublic,
    resumeEligible: entry.resumeEligible,
    announceOnLinkedIn: entry.announceOnLinkedIn,
    isBeta: entry.isBeta,
    updatedAt: sql`now()`,
  };
}

export async function saveItem(entry: Item): Promise<string> {
  const db = getDb("admin");

  return db.transaction(async (tx) => {
    await tx
      .insert(item)
      .values({ id: entry.id, ...itemValues(entry) })
      .onConflictDoUpdate({ target: item.id, set: itemValues(entry) });

    const itemId = entry.id;

    await tx.delete(itemUrl).where(eq(itemUrl.itemId, itemId));
    if (entry.urls.length > 0) {
      await tx.insert(itemUrl).values(
        entry.urls.map((link, index) => ({
          itemId,
          label: link.label,
          url: link.url,
          displayOrder: index,
        })),
      );
    }

    await tx.delete(bullet).where(eq(bullet.itemId, itemId));
    if (entry.bullets.length > 0) {
      await tx.insert(bullet).values(
        entry.bullets.map((body, index) => ({
          itemId,
          body,
          displayOrder: index,
        })),
      );
    }

    await tx.delete(itemSkill).where(eq(itemSkill.itemId, itemId));
    for (const name of entry.skills) {
      await tx
        .insert(skill)
        .values({ name, category: "Uncategorised" })
        .onConflictDoNothing({ target: skill.name });

      await tx.execute(sql`
        insert into item_skill (item_id, skill_id)
        select ${itemId}::uuid, id from skill where name = ${name}
        on conflict do nothing
      `);
    }

    return itemId;
  });
}

export async function deleteItem(id: string): Promise<void> {
  await getDb("admin").delete(item).where(eq(item.id, id));
}
