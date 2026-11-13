-- Public read path.
--
-- app_read gets SELECT on these three views and nothing else, so the site
-- physically cannot read a non-public item, the auth tables or a draft.
-- Views are owned by the migrate role and run with its privileges.

create or replace view public_profile as
select
  p.name,
  p.headline,
  p.summary,
  p.email,
  p.links
from profile p
where p.id = 1;

create or replace view public_skill as
select
  s.name,
  s.category,
  s.display_order
from skill s;

create or replace view public_item as
select
  i.id,
  i.slug,
  i.type,
  i.title,
  i.org,
  i.location,
  i.start_date,
  i.end_date,
  i.description_long,
  i.summary_short,
  i.display_order,
  i.is_public,
  i.resume_eligible,
  i.announce_on_linkedin,
  i.is_beta,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object('label', u.label, 'url', u.url)
        order by u.display_order, u.label
      )
      from item_url u
      where u.item_id = i.id
    ),
    '[]'::jsonb
  ) as urls,
  coalesce(
    (
      select jsonb_agg(b.body order by b.display_order)
      from bullet b
      where b.item_id = i.id
    ),
    '[]'::jsonb
  ) as bullets,
  coalesce(
    (
      select jsonb_agg(s.name order by s.display_order, s.name)
      from item_skill isk
      join skill s on s.id = isk.skill_id
      where isk.item_id = i.id
    ),
    '[]'::jsonb
  ) as skills
from item i
where i.is_public;

-- The current published resume snapshot, for the public /resume page and the
-- .docx download.
create or replace view public_resume as
select
  r.version,
  r.body,
  r.published_at
from published_resume r
where r.is_current;
