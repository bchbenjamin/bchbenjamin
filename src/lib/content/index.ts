import rawContent from "@/content/site.json";

import {
  publicItemBySlug,
  publicItems,
  publicItemsByType,
  skillsByCategory,
} from "./selectors";
import {
  ITEM_TYPES,
  type Item,
  type ItemType,
  type ItemUrl,
  type Profile,
  type ProfileLink,
  type SiteContent,
  type Skill,
} from "./types";

/*
 * The checked-in content is the fallback source: it is what the site serves
 * until DATABASE_URL_APP exists, and it is what the tests run against. Once the
 * database is configured, src/content/repository.ts reads the public views
 * instead and reuses the same validators and selectors.
 */

function fail(path: string, expected: string): never {
  throw new Error(`Invalid site content: ${path} must be ${expected}`);
}

function objectAt(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path, "an object");
  }
  return value as Record<string, unknown>;
}

function arrayAt(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) fail(path, "an array");
  return value;
}

function stringAt(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    fail(path, "a non-empty string");
  }
  return value;
}

function nullableStringAt(value: unknown, path: string): string | null {
  if (value === null || value === undefined) return null;
  return stringAt(value, path);
}

function booleanAt(value: unknown, path: string): boolean {
  if (typeof value !== "boolean") fail(path, "a boolean");
  return value;
}

function integerAt(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    fail(path, "an integer");
  }
  return value;
}

function monthAt(value: unknown, path: string): string {
  const month = stringAt(value, path);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) fail(path, "a yyyy-mm month");
  return month;
}

function stringArrayAt(value: unknown, path: string): string[] {
  return arrayAt(value, path).map((entry, index) =>
    stringAt(entry, `${path}[${index}]`),
  );
}

function httpsUrlAt(value: unknown, path: string): string {
  const raw = stringAt(value, path);
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    fail(path, "an absolute URL");
  }
  if (parsed.protocol !== "https:") fail(path, "an https URL");
  return parsed.toString();
}

function isItemType(value: string): value is ItemType {
  return (ITEM_TYPES as readonly string[]).includes(value);
}

function parseUrl(value: unknown, path: string): ItemUrl {
  const url = objectAt(value, path);
  return {
    label: stringAt(url.label, `${path}.label`),
    url: httpsUrlAt(url.url, `${path}.url`),
  };
}

export function parseItem(value: unknown, path = "item"): Item {
  const item = objectAt(value, path);
  const type = stringAt(item.type, `${path}.type`);
  if (!isItemType(type)) fail(`${path}.type`, `one of ${ITEM_TYPES.join(", ")}`);

  return {
    id: stringAt(item.id, `${path}.id`),
    slug: stringAt(item.slug, `${path}.slug`),
    type,
    title: stringAt(item.title, `${path}.title`),
    org: nullableStringAt(item.org, `${path}.org`),
    location: nullableStringAt(item.location, `${path}.location`),
    startDate: monthAt(item.startDate, `${path}.startDate`),
    endDate:
      item.endDate === null || item.endDate === undefined
        ? null
        : monthAt(item.endDate, `${path}.endDate`),
    descriptionLong: stringAt(item.descriptionLong, `${path}.descriptionLong`),
    summaryShort: stringAt(item.summaryShort, `${path}.summaryShort`),
    displayOrder: integerAt(item.displayOrder, `${path}.displayOrder`),
    isPublic: booleanAt(item.isPublic, `${path}.isPublic`),
    resumeEligible: booleanAt(item.resumeEligible, `${path}.resumeEligible`),
    announceOnLinkedIn: booleanAt(
      item.announceOnLinkedIn,
      `${path}.announceOnLinkedIn`,
    ),
    isBeta: booleanAt(item.isBeta, `${path}.isBeta`),
    urls: arrayAt(item.urls, `${path}.urls`).map((entry, index) =>
      parseUrl(entry, `${path}.urls[${index}]`),
    ),
    bullets: stringArrayAt(item.bullets, `${path}.bullets`),
    skills: stringArrayAt(item.skills, `${path}.skills`),
  };
}

function parseProfileLink(value: unknown, path: string): ProfileLink {
  const link = objectAt(value, path);
  return {
    label: stringAt(link.label, `${path}.label`),
    url: httpsUrlAt(link.url, `${path}.url`),
  };
}

export function parseProfile(value: unknown): Profile {
  const profile = objectAt(value, "profile");
  return {
    name: stringAt(profile.name, "profile.name"),
    headline: stringAt(profile.headline, "profile.headline"),
    summary: stringAt(profile.summary, "profile.summary"),
    email: stringAt(profile.email, "profile.email"),
    links: arrayAt(profile.links, "profile.links").map((entry, index) =>
      parseProfileLink(entry, `profile.links[${index}]`),
    ),
  };
}

export function parseSkill(value: unknown, path = "skill"): Skill {
  const skill = objectAt(value, path);
  return {
    name: stringAt(skill.name, `${path}.name`),
    category: stringAt(skill.category, `${path}.category`),
  };
}

export function parseSiteContent(value: unknown): SiteContent {
  const root = objectAt(value, "content");
  return {
    profile: parseProfile(root.profile),
    items: arrayAt(root.items, "items").map((entry, index) =>
      parseItem(entry, `items[${index}]`),
    ),
    skills: arrayAt(root.skills, "skills").map((entry, index) =>
      parseSkill(entry, `skills[${index}]`),
    ),
  };
}

export const siteContent: SiteContent = parseSiteContent(rawContent);

export const profile: Profile = siteContent.profile;

/** Items that may appear on the public site, in display order. */
export function getPublicItems(): Item[] {
  return publicItems(siteContent);
}

export function getPublicItemsByType(type: ItemType): Item[] {
  return publicItemsByType(siteContent, type);
}

export function getPublicItemBySlug(slug: string): Item | undefined {
  return publicItemBySlug(siteContent, slug);
}

export function getFeaturedProjects(limit = 3): Item[] {
  return publicItemsByType(siteContent, "PROJECT").slice(0, limit);
}

export function getSkillsByCategory(): { category: string; skills: string[] }[] {
  return skillsByCategory(siteContent);
}
