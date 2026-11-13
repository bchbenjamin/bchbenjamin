import type { Item, ItemType, SiteContent } from "./types";

/*
 * Pure selectors over a SiteContent snapshot. The public site, the resume
 * engine and the tests all share these, whether the snapshot came from
 * Postgres or from the checked-in JSON.
 */

function byDisplayOrder(a: Item, b: Item): number {
  if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
  return b.startDate.localeCompare(a.startDate);
}

export function publicItems(content: SiteContent): Item[] {
  return content.items.filter((item) => item.isPublic).sort(byDisplayOrder);
}

export function publicItemsByType(
  content: SiteContent,
  type: ItemType,
): Item[] {
  return publicItems(content).filter((item) => item.type === type);
}

export function publicItemBySlug(
  content: SiteContent,
  slug: string,
): Item | undefined {
  return publicItems(content).find((item) => item.slug === slug);
}

export function featuredProjects(content: SiteContent, limit = 3): Item[] {
  return publicItemsByType(content, "PROJECT").slice(0, limit);
}

export function skillsByCategory(
  content: SiteContent,
): { category: string; skills: string[] }[] {
  const groups = new Map<string, string[]>();
  for (const skill of content.skills) {
    const skills = groups.get(skill.category);
    if (skills) skills.push(skill.name);
    else groups.set(skill.category, [skill.name]);
  }
  return [...groups].map(([category, skills]) => ({ category, skills }));
}

/** Items the resume engine may include, newest first within display order. */
export function resumeItems(content: SiteContent): Item[] {
  return content.items
    .filter((item) => item.resumeEligible)
    .sort((a, b) => {
      const order = byDisplayOrder(a, b);
      if (order !== 0 && a.displayOrder !== b.displayOrder) return order;
      return b.startDate.localeCompare(a.startDate);
    });
}
