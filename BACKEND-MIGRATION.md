# Native Next.js backend

The production project uses Next.js App Router and the existing Neon PostgreSQL database.
There is no Java runtime, Maven build, Docker backend or external Spring API in the deployment.
Historical SQL migrations are retained in db/migrations. V21 adds native owner sessions
and staged media uploads without deleting previous tables or records.

## Runtime
- Public portfolio routes use ISR (60 seconds); admin content mutations invalidate public layout caches.
- Public API and media reads enforce existing publication and attachment visibility rules.
- Google OIDC uses PKCE, nonce, state, an owner allowlist and secure cookies. TOTP is required
  for privileged operations. Existing encrypted authenticator enrollment is retained.
  Sign in again after migration because the native session format differs.
- Uploads are staged in 2 MiB chunks and assembled server-side, with a 12 MiB file limit.
- Native admin routes handle content, site settings, private media, analytics, notifications,
  audit, resume PDF generation, contact and LinkedIn integrations.
- Agent/MCP remote execution remains disabled by design.
- Contact email and LinkedIn publishing require configured provider credentials.
  Resume AI is optional; an evidence-based fallback is available.

## Operations
Run npm ci, npm test, npm run lint, npm run typecheck and npm run build.
For an existing database, apply pending schema migrations with npm run db:migrate
using DATABASE_URL. Do not reset or replace the existing database.
Required production authentication variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
ADMIN_ALLOWED_SUBJECTS, TOKEN_ENCRYPTION_KEY and DATABASE_URL. FRONTEND_URL defaults
to https://www.bchbenjamin.in. Optional provider variables are documented in .env.example.
CRON_SECRET is required for authenticated scheduled maintenance.
Do not publish secrets or local .env files.

Rollback: retain the previous deployment and Git commit. V21 is additive, so the previous
application can still use the same database. Do not drop tables during a rollback.

## Cost
The CDN serves cached public pages and static assets. Only dynamic operations use functions.
There is no continuously running JVM. Hobby quotas still apply to function usage, bandwidth,
ISR, storage and database compute; no unlimited-traffic guarantee is implied.
