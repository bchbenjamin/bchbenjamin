# Low-cost backend migration

## Phase 1 — public reads and telemetry
The public API collections and SSR read directly from the existing Neon PostgreSQL
database using the HTTP serverless driver. No new database is created. Public queries
retain publication filters, field visibility and attachment visibility. Ordinary
visitors no longer call the owner-session endpoint. Telemetry sends one anonymous
visit instead of periodic heartbeats. Notifications are delivered with the initial
portfolio snapshot; expiry is evaluated locally.

The previous Spring API remains routed for contact, owner login/TOTP,
admin CRUD, uploads, resume, LinkedIn, scoped agent/MCP and maintenance. It must
not be removed until parity/security tests pass. Public files use visibility-checked streaming/range responses and conditional HTTP validation for revocation safety. The public read path fails closed when the database is unavailable.

## Phase 2 — separate media and delivery
Use a static/CDN-first public frontend. Publish only sanitized public data; keep
private media inaccessible. A publication/unpublication must invalidate the public
HTML and media caches. Add distributed abuse prevention for public write endpoints and manual speed tests. Account for the existing 12 MB media upload capability before switching media
to a function runtime with smaller request/response limits.

## Phase 3 — private backend parity
Port Google OIDC (state, nonce, PKCE, exact redirect), server-side sessions, owner
subject allowlist, TOTP encryption/verification, CSRF and rate limits first. Port
CRUD, audit logs, site configuration, attachment publication, notifications, private
resume generation, contact verification/moderation/mail, agent credentials/MCP,
LinkedIn publishing and scheduled maintenance. Keep the existing PostgreSQL schema
and data; version migrations and test rollback. Compare public/private behavior,
authorization, upload sizes and API contracts before switching traffic. Keep the
legacy service as rollback until verified; do not reset the production database.

## Hosting target
Cloudflare Workers static assets / Pages are an alternative for the public frontend:
static requests need no Worker invocation. Dynamic requests, database compute and
storage still have quotas. Vercel Hobby remains viable for a CDN-first public site
with low-frequency private operations, but is not unlimited.
