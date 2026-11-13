/*
 * Seeds the content tables from src/content/site.json.
 *
 * Idempotent: items upsert on slug, skills on name, profile on id 1, and each
 * item's urls, bullets and skill links are rewritten. Safe to re-run after a
 * migration.
 */
import { readFile } from "node:fs/promises";

import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL_MIGRATE;
if (!url) {
  console.error("DATABASE_URL_MIGRATE is not set.");
  process.exit(1);
}

const content = JSON.parse(
  await readFile(new URL("../src/content/site.json", import.meta.url), "utf8"),
);

const pool = new Pool({ connectionString: url });
const client = await pool.connect();

try {
  await client.query("begin");

  const profile = content.profile;
  await client.query(
    `insert into profile (id, name, headline, summary, email, links)
     values (1, $1, $2, $3, $4, $5::jsonb)
     on conflict (id) do update set
       name = excluded.name,
       headline = excluded.headline,
       summary = excluded.summary,
       email = excluded.email,
       links = excluded.links,
       updated_at = now()`,
    [
      profile.name,
      profile.headline,
      profile.summary,
      profile.email,
      JSON.stringify(profile.links),
    ],
  );

  for (const [index, entry] of content.skills.entries()) {
    await client.query(
      `insert into skill (name, category, display_order)
       values ($1, $2, $3)
       on conflict (name) do update set
         category = excluded.category,
         display_order = excluded.display_order`,
      [entry.name, entry.category, index],
    );
  }

  for (const entry of content.items) {
    const { rows } = await client.query(
      `insert into item (
         id, slug, type, title, org, location, start_date, end_date,
         description_long, summary_short, display_order, is_public,
         resume_eligible, announce_on_linkedin, is_beta
       )
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       on conflict (slug) do update set
         type = excluded.type,
         title = excluded.title,
         org = excluded.org,
         location = excluded.location,
         start_date = excluded.start_date,
         end_date = excluded.end_date,
         description_long = excluded.description_long,
         summary_short = excluded.summary_short,
         display_order = excluded.display_order,
         is_public = excluded.is_public,
         resume_eligible = excluded.resume_eligible,
         announce_on_linkedin = excluded.announce_on_linkedin,
         is_beta = excluded.is_beta,
         updated_at = now()
       returning id`,
      [
        entry.id,
        entry.slug,
        entry.type,
        entry.title,
        entry.org,
        entry.location,
        entry.startDate,
        entry.endDate,
        entry.descriptionLong,
        entry.summaryShort,
        entry.displayOrder,
        entry.isPublic,
        entry.resumeEligible,
        entry.announceOnLinkedIn,
        entry.isBeta,
      ],
    );
    const itemId = rows[0].id;

    await client.query("delete from item_url where item_id = $1", [itemId]);
    for (const [index, link] of entry.urls.entries()) {
      await client.query(
        "insert into item_url (item_id, label, url, display_order) values ($1,$2,$3,$4)",
        [itemId, link.label, link.url, index],
      );
    }

    await client.query("delete from bullet where item_id = $1", [itemId]);
    for (const [index, body] of entry.bullets.entries()) {
      await client.query(
        "insert into bullet (item_id, body, display_order) values ($1,$2,$3)",
        [itemId, body, index],
      );
    }

    await client.query("delete from item_skill where item_id = $1", [itemId]);
    for (const name of entry.skills) {
      await client.query(
        `insert into skill (name, category)
         values ($1, 'Uncategorised')
         on conflict (name) do nothing`,
        [name],
      );
      await client.query(
        `insert into item_skill (item_id, skill_id)
         select $1, id from skill where name = $2
         on conflict do nothing`,
        [itemId, name],
      );
    }
  }

  await client.query("commit");
  console.log(
    `seeded ${content.items.length} item(s), ${content.skills.length} skill(s)`,
  );
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  client.release();
  await pool.end();
}
