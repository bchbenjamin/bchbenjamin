import "server-only";

import { cache } from "react";

import { siteContent } from "@/lib/content";
import {
  featuredProjects,
  publicItemBySlug,
  publicItems,
  publicItemsByType,
  resumeItems,
  skillsByCategory,
} from "@/lib/content/selectors";
import type { Item, ItemType, Profile, SiteContent } from "@/lib/content/types";

import { isDatabaseConfigured } from "@/db/config";
import { loadFromDatabase } from "@/db/read";

/*
 * The one place the rest of the app asks for content. Postgres through the
 * app_read role when DATABASE_URL_APP is set, the checked-in JSON otherwise, so
 * CI and fresh clones build without secrets. React's cache keeps a single load
 * per request; pages add their own revalidate window on top.
 */

export const getSiteContent = cache(async (): Promise<SiteContent> => {
  if (!isDatabaseConfigured()) return siteContent;
  return loadFromDatabase();
});

export async function getProfile(): Promise<Profile> {
  return (await getSiteContent()).profile;
}

export async function getPublicItems(): Promise<Item[]> {
  return publicItems(await getSiteContent());
}

export async function getPublicItemsByType(type: ItemType): Promise<Item[]> {
  return publicItemsByType(await getSiteContent(), type);
}

export async function getPublicItemBySlug(slug: string): Promise<Item | undefined> {
  return publicItemBySlug(await getSiteContent(), slug);
}

export async function getFeaturedProjects(limit = 3): Promise<Item[]> {
  return featuredProjects(await getSiteContent(), limit);
}

export async function getSkillsByCategory(): Promise<
  { category: string; skills: string[] }[]
> {
  return skillsByCategory(await getSiteContent());
}

export async function getResumeItems(): Promise<Item[]> {
  return resumeItems(await getSiteContent());
}
