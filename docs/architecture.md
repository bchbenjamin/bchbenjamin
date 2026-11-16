# Portfolio platform architecture

## System of record

PostgreSQL is the canonical source of truth for profile, projects, experience, education, skills, achievements, resume content and publishing state. LinkedIn is a publishing destination only; it is not used as a profile database.

## Runtime topology

- **Web:** Next.js App Router + TypeScript, deployed to Vercel.
- **API:** Java 21 + Spring Boot REST API, designed for a container runtime such as Google Cloud Run.
- **Database:** PostgreSQL, with Neon as the managed target and a local Docker Compose service for development.
- **Schema:** Flyway-managed migrations; Hibernate validates the schema and never mutates it at runtime.
- **Public read path:** anonymous, read-only API endpoints. Admin writes are introduced only after the authentication and authorization phases.

## Repository layout

- `src/` — Next.js application.
- `backend/` — Spring Boot API and database migrations.
- `infra/` — local infrastructure and deployment manifests.
- `docs/` — architecture decisions and operating notes.

## Security boundaries

1. The browser never receives database credentials or provider client secrets.
2. Public endpoints expose only explicitly published fields and records.
3. Admin APIs are deny-by-default and will not be exposed until the OIDC and role checks are implemented.
4. Provider tokens and connector credentials are never stored in plaintext.
5. Database schema changes are versioned and applied by Flyway migrations.

## Local API development

Start PostgreSQL:

```bash
docker compose -f infra/compose.yaml up -d postgres
```

Run the API:

```bash
./mvnw -f backend/pom.xml spring-boot:run
```

The API health endpoint is `http://localhost:8080/api/v1/health`.

The development database password in Compose is intentionally local-only. Use a separate secret in every hosted environment.
