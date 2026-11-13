import { parseItem, parseProfile, parseSkill } from "@/lib/content";
import type { Item, Profile, Skill } from "@/lib/content/types";

/*
 * Row shapes returned by the public views (drizzle/sql/0001_public_views.sql)
 * and the mapping back into the validated content model. Pure functions: the
 * database is never touched here, so they are unit tested directly.
 */

export type ItemRow = {
  id: string;
  slug: string;
  type: string;
  title: string;
  org: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  description_long: string;
  summary_short: string;
  display_order: number;
  is_public: boolean;
  resume_eligible: boolean;
  announce_on_linkedin: boolean;
  is_beta: boolean;
  urls: unknown;
  bullets: unknown;
  skills: unknown;
};

export type ProfileRow = {
  name: string;
  headline: string;
  summary: string;
  email: string;
  links: unknown;
};

export type SkillRow = {
  name: string;
  category: string;
};

export function mapItemRow(row: ItemRow): Item {
  return parseItem(
    {
      id: row.id,
      slug: row.slug,
      type: row.type,
      title: row.title,
      org: row.org,
      location: row.location,
      startDate: row.start_date,
      endDate: row.end_date,
      descriptionLong: row.description_long,
      summaryShort: row.summary_short,
      displayOrder: row.display_order,
      isPublic: row.is_public,
      resumeEligible: row.resume_eligible,
      announceOnLinkedIn: row.announce_on_linkedin,
      isBeta: row.is_beta,
      urls: row.urls,
      bullets: row.bullets,
      skills: row.skills,
    },
    `item(${row.slug})`,
  );
}

export function mapProfileRow(row: ProfileRow): Profile {
  return parseProfile({
    name: row.name,
    headline: row.headline,
    summary: row.summary,
    email: row.email,
    links: row.links,
  });
}

export function mapSkillRow(row: SkillRow, index: number): Skill {
  return parseSkill(row, `skill[${index}]`);
}
