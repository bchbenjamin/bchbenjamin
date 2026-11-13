import "server-only";

import type { SiteContent } from "@/lib/content/types";

import { getPool } from "./client";
import {
  mapItemRow,
  mapProfileRow,
  mapSkillRow,
  type ItemRow,
  type ProfileRow,
  type SkillRow,
} from "./map";

/*
 * Every public read goes through the app_read role and the public views, which
 * expose public rows only. A bug here cannot leak a non-public item: the role
 * has no grant on the base tables.
 */

const PROFILE_QUERY = `
  select name, headline, summary, email, links
  from public_profile
  limit 1
`;

const ITEMS_QUERY = `
  select id, slug, type, title, org, location, start_date, end_date,
         description_long, summary_short, display_order, is_public,
         resume_eligible, announce_on_linkedin, is_beta,
         urls, bullets, skills
  from public_item
  order by display_order asc, start_date desc
`;

const SKILLS_QUERY = `
  select name, category
  from public_skill
  order by display_order asc, name asc
`;

export async function loadFromDatabase(): Promise<SiteContent> {
  const pool = getPool("app");

  const [profileRows, itemRows, skillRows] = await Promise.all([
    pool.query<ProfileRow>(PROFILE_QUERY),
    pool.query<ItemRow>(ITEMS_QUERY),
    pool.query<SkillRow>(SKILLS_QUERY),
  ]);

  const profileRow = profileRows.rows[0];
  if (!profileRow) {
    throw new Error("public_profile has no row: run npm run db:seed");
  }

  return {
    profile: mapProfileRow(profileRow),
    items: itemRows.rows.map(mapItemRow),
    skills: skillRows.rows.map(mapSkillRow),
  };
}
