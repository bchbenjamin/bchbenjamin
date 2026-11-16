# Security and operations baseline

## Controls in the application

- Public endpoints are read-only and query published records only.
- Admin endpoints require an OIDC identity whose exact issuer and subject are allowlisted.
- Session cookies are HttpOnly and SameSite=Lax; production must set Secure and use a `__Host-` cookie name.
- CSRF is enabled for browser/session mutations. Only bearer-token agent endpoints are exempt.
- CORS is an explicit origin allowlist with credentials; wildcard origins are not supported.
- Agent keys have 256 bits of random entropy, are stored as SHA-256 hashes, expire after 90 days by default and can be revoked.
- LinkedIn access and refresh tokens are encrypted using AES-256-GCM with a random IV per token.
- SQL table and column identifiers used by generic CMS CRUD are fixed allowlists; values are parameterized.
- Response headers include HSTS, CSP, frame denial, content-type protection, referrer policy, permissions policy and cache controls.
- Request body size limits are configured at the API server.
- Fixed-window rate limits are applied per API instance: public 120/minute/IP, agent 60/minute/token, admin 120/minute/identity and default 60/minute/IP. Limits are configurable through environment variables.
- GitHub Actions runs Gitleaks, npm audit, frontend tests/type checks/build and backend integration tests. Dependabot monitors npm, Maven and GitHub Actions dependencies.

## Rate-limit deployment caveat

The current limiter is in-memory and per application instance. It protects a single instance and provides a useful baseline, but limits are not shared across multiple Cloud Run instances or regions. Before scaling horizontally, enforce global quotas at an API gateway/Cloud Armor layer or move counters to a shared Redis-compatible store. Do not describe these in-process limits as a distributed abuse-prevention system.

## Secret handling

Never commit `.env`, OAuth client secrets, database credentials, LinkedIn tokens, the AES key or agent API keys. Production secrets belong in the runtime secret manager. Keep `TOKEN_ENCRYPTION_KEY` stable and backed up separately from the database; loss of the key makes stored LinkedIn tokens unrecoverable.

## PostgreSQL backup and restore drill

Backups are not automatically configured by this repository. Use the managed database provider's backup/PITR facility and retain an independent encrypted export. A manual custom-format export can be made with:

```bash
pg_dump "$DATABASE_URL" --format=custom --no-owner --file=portfolio-$(date -u +%Y%m%dT%H%M%SZ).dump
sha256sum portfolio-*.dump
```

Restore only into a separate, isolated database first:

```bash
pg_restore --clean --if-exists --no-owner --dbname="$RESTORE_DATABASE_URL" portfolio-backup.dump
```

Then verify Flyway migration state, public profile/project reads, admin access controls and PDF generation. Never test a restore against the live production database.

## Pre-production checklist

- Set the production API origin in both `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL`.
- Set exact `ALLOWED_ORIGINS` and `FRONTEND_URL` values.
- Configure `SESSION_COOKIE_NAME=__Host-PORTFOLIO_SESSION` and `SESSION_COOKIE_SECURE=true`.
- Set OAuth client secrets and the exact `ADMIN_ALLOWED_SUBJECTS` values.
- Generate and securely store a 32-byte base64 `TOKEN_ENCRYPTION_KEY`.
- Configure LinkedIn OIDC and `w_member_social` access, plus a currently supported `LINKEDIN_API_VERSION`, before enabling publishing.
- Set production database credentials and managed backups/PITR.
- Verify rate limits at the gateway if running multiple API instances.
- Perform an isolated database restore drill.
