# Portfolio platform architecture

## Design principle

One private source of truth, with multiple controlled consumers. PostgreSQL stores verified career records and owner-controlled presentation configuration. The public site, private resume generator and (in a later phase) agent integrations consume different permission-scoped projections.

## Runtime topology

- **Web:** Next.js App Router, React and TypeScript.
- **API:** Java 21 and Spring Boot.
- **Database:** PostgreSQL; Flyway owns schema migrations.
- **Authentication:** Google/LinkedIn OIDC authorization code flow, exact immutable `issuer|sub` owner allowlist, server-side sessions and CSRF.
- **Media:** bounded private uploads stored as PostgreSQL `BYTEA` for the first implementation; metadata and relationships remain relational. A private S3-compatible store is the intended scale-out path.
- **Resume:** Java PDF rendering over verified private records; OpenAI-compatible model may rank source records for a JD, with deterministic keyword matching as fallback.

## Trust boundaries

1. Public APIs return only explicitly published records and fields. They never serialize persistence entities or custom private metadata.
2. The Next.js public layer does not fall back to a stale static profile when a live API is configured but unavailable.
3. The owner API is denied by default and requires `ROLE_ADMIN`.
4. Resume source data, generation snapshots and PDF bytes are private; all resume routes are under `/api/v1/admin/resumes/**`.
5. Public media delivery requires an explicitly `PUBLIC` image asset; original uploads are private by default.
6. Agent REST and MCP routes are currently denied intentionally. MCP work is paused and must undergo a separate permission and threat-model review before reactivation.
7. OAuth secrets, AI provider keys, database credentials and encryption keys exist only in server-side environment configuration.

## Data-plane layout

- **Career records:** profile, projects, experience, education, skill groups, skills and achievements.
- **Publication controls:** `published` status plus a `public_fields` allowlist per record. New records default to private fields; existing published rows receive explicit field allowlists in V12.
- **Custom fields:** reusable definitions in `custom_field_definitions`, with per-record values in `custom_fields` JSONB and explicit publication flags.
- **Media:** `media_assets`, `media_relationships`; content bytes and metadata are separate concerns in the API contract.
- **Site builder:** `site_configuration.draft_config` and `.published_config`; publication is an explicit copy operation.
- **Resume generations:** JD, selected source IDs, source snapshot, match report, PDF and timestamp are retained in `resume_generations`.
- **Audit:** administrative mutations, uploads, publication, resume generation and deletion are recorded.

## Request paths

- Public website → `GET /api/v1/public/**` → published read models only.
- Owner browser → OIDC session → `/api/v1/admin/**` → owner authorization and CSRF.
- Resume Studio → authenticated generation request → private source snapshot → selection/validation → PDF renderer → private history/download.
- Public gallery → published achievement + published image relationship + `GET /api/v1/public/media/{id}`.

## Local API development

```bash
docker compose -f infra/compose.yaml up -d postgres
./mvnw -f backend/pom.xml spring-boot:run
npm run dev
```

See `authentication.md`, `content-model.md`, `resume-engine.md` and `security-operations.md` for subsystem details.
