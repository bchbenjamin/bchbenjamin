# Portfolio content model

The Phase 2 schema is relational and deliberately separates the public profile from the content collections.

| Table | Purpose | Public visibility |
| --- | --- | --- |
| `profile` | Owner identity, headline, summary and public links | Published row only |
| `projects` | Project descriptions, repository/live links, status and ordering | Published rows only |
| `experience` | Roles, organizations, dates and descriptions | Published rows only |
| `education` | Institution, qualification, dates and grade | Published rows only |
| `skill_groups` / `skills` | Categorized skill taxonomy | Published groups and their skills |
| `achievements` | Awards, milestones and credential links | Published rows only |

Every mutable content table carries timestamps, publication state where appropriate, and deterministic ordering. Project slugs are unique. Deleting a skill group cascades to its skills. Flyway owns all schema changes; Hibernate is configured to validate rather than create or mutate schema.

## Public API

- `GET /api/v1/public/profile`
- `GET /api/v1/public/projects`
- `GET /api/v1/public/projects/{slug}`
- `GET /api/v1/public/experience`
- `GET /api/v1/public/education`
- `GET /api/v1/public/skills`
- `GET /api/v1/public/achievements`

The public read layer queries only published records and uses explicit projections rather than returning persistence entities. Admin write endpoints are intentionally not exposed until the OIDC/session and authorization controls in Phase 3 are in place. This avoids shipping unauthenticated content mutation routes.

## Migrations

- `V1`: schema metadata marker.
- `V2`: normalized portfolio content tables and indexes.
- `V3`: initial public profile, selected projects, experience, achievements and skills.

Education remains empty until verified education details are added; no qualification or dates are fabricated.
