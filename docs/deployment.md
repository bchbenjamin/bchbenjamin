# Deployment runbook

## Recommended topology: one Vercel project

The repository now uses **Vercel Services** to deploy both the Next.js frontend and the Java 21 Spring Boot API from one project:

- `frontend`: Next.js 16, built from the repository root.
- `backend`: Spring Boot 3 / Java 21 container built from `backend/Dockerfile.vercel`.
- `vercel.json`: routes `/api/v1/*`, OAuth callbacks, `/mcp` and health requests to the backend container; all other paths go to Next.js.
- PostgreSQL: external managed Postgres (Neon is a suitable serverless option; a Render Postgres database also works).
- Sessions: Spring Session JDBC stores authentication sessions in PostgreSQL, so container replacement and scale-out do not lose logins.
- Maintenance: Vercel Cron invokes a protected Next.js route daily, which calls the backend maintenance endpoint. It is a scheduled cleanup/recovery task, not a keep-alive ping.

Vercel's container runtime and multi-service support are currently beta. Container instances are stateless and scale down when idle. The application therefore stores sessions and all durable state in PostgreSQL. The Vercel container listens on the configured `PORT`; set `PORT=8080` in the Vercel project environment.

## Vercel setup

1. Merge the implementation PR into `main`.
2. Import `bchbenjamin/bchbenjamin` into Vercel. In Project Settings → Build and Deployment, set the framework preset to **Services**. Use the repository root; `vercel.json` configures the `frontend` and `backend` services.
3. Set Node.js 24.x for the Next.js service.
4. Create a PostgreSQL database. Neon is a good fit for a low-volume serverless API; copy its pooled connection string into `DATABASE_URL` and retain `sslmode=require`. The backend also supports Render Postgres connection strings.
5. Configure these project environment variables in Vercel (Preview and Production as appropriate):
   - `DATABASE_URL`: managed Postgres connection string.
   - `PORT=8080`: non-privileged HTTP port for the backend container.
   - `API_BASE_URL=https://bchbenjamin.in`.
   - `NEXT_PUBLIC_API_BASE_URL` may be left empty; browser requests then use same-origin routes. Setting it to `https://bchbenjamin.in` is also valid.
   - `FRONTEND_URL=https://bchbenjamin.in`.
   - `ALLOWED_ORIGINS=https://bchbenjamin.in,https://www.bchbenjamin.in`.
   - `SESSION_COOKIE_NAME=__Host-PORTFOLIO_SESSION` and `SESSION_COOKIE_SECURE=true`.
   - `TOKEN_ENCRYPTION_KEY`: generate a base64-encoded 32-byte AES key and keep it stable across deployments.
   - `ADMIN_ALLOWED_SUBJECTS`: exact immutable OIDC `issuer|sub` allowlist.
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, `LINKEDIN_API_VERSION`.
   - `CONTACT_AI_BASE_URL`, `CONTACT_AI_API_KEY`, `CONTACT_AI_MODEL`, and optionally `CONTACT_AI_PATH=/v1/chat/completions`.
   - `SMTP_USERNAME`, `SMTP_APP_PASSWORD`, optional `CONTACT_FROM_EMAIL`, `CONTACT_INBOX_EMAIL=bchbenjamin@gmail.com`, and optional `CONTACT_NOTIFICATION_CC`.
   - `CONTACT_IP_HASH_SALT`.
   - `CRON_SECRET`: a long random secret. Vercel Cron sends it as `Authorization: Bearer ...`; the Next.js route forwards it to the backend maintenance endpoint.
6. Configure OAuth redirect URIs exactly:
   - `https://bchbenjamin.in/login/oauth2/code/google`
   - `https://bchbenjamin.in/login/oauth2/code/linkedin`
   - `https://bchbenjamin.in/login/oauth2/code/linkedin-publisher`
7. Attach `bchbenjamin.in` and `www.bchbenjamin.in` to the Vercel project and configure the DNS records Vercel provides. Choose one canonical hostname.
8. Deploy a Preview first. Test public routes, database-backed content, OAuth login, session persistence across requests, PDF generation, contact verification, AI moderation, inbox delivery and the admin review queue. Then promote Production.

### Contact mail on Vercel

Vercel does not block outbound SMTP except port 25; Gmail SMTP on port 587 with STARTTLS is usable. Email delivery is awaited synchronously by the backend. Vercel recommends a transactional email API for production delivery, but this implementation supports the requested alternate Gmail account and App Password. Use Google's App Password only if 2-Step Verification is enabled and the account is eligible. `CONTACT_FROM_EMAIL` should match the authenticated Gmail sender.

The notification is sent from the alternate Gmail account to the primary inbox. `Reply-To` is set to the verified sender, so pressing Reply in primary Gmail sends directly to that person. The alternate mailbox retains the original notification in Sent; it is not automatically copied on replies sent from the primary account unless you configure a separate Gmail rule or use Reply All with an appropriate CC.

### Vercel Cron

The daily cron at `/api/cron/contact-maintenance` performs two maintenance tasks: recovers notification attempts stuck in `NOTIFYING` for over ten minutes, and deletes contact submissions older than the configured retention window. It also removes expired JDBC sessions. It does not keep the API container warm. Hobby cron timing is approximate (daily with up to 59 minutes of variance); this is sufficient for cleanup, not real-time delivery.

## Render fallback

If you prefer a conventional always-on Spring Boot service instead of Vercel's beta container runtime, use the existing root `render.yaml` Blueprint:

1. Connect the repository to Render and create the Blueprint.
2. Review the paid Singapore web-service and Postgres plans. Free web services sleep and free Postgres expires; the Blueprint uses paid plans.
3. Configure the prompted OAuth, AI and SMTP secrets.
4. The API is served at `api.bchbenjamin.in`; set `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` to `https://api.bchbenjamin.in` in Vercel.
5. Register OAuth callbacks at `https://api.bchbenjamin.in/login/oauth2/code/google`, `.../linkedin` and `.../linkedin-publisher`.
6. The Render Blueprint enables the in-process maintenance scheduler. It does not need Vercel Cron.

You do not need a new Render account. Use the existing Render workspace if choosing this fallback.

## Shared production checks

- Flyway applies migrations V1–V10 on API startup. Never edit the live schema manually.
- Keep `TOKEN_ENCRYPTION_KEY`, AI API key, Gmail App Password, OAuth secrets, database credentials and `CRON_SECRET` out of Git and browser-visible `NEXT_PUBLIC_*` variables.
- Back up the encryption key separately; losing it makes stored LinkedIn tokens unrecoverable.
- Configure managed Postgres backups/PITR and perform an isolated restore drill.
- Contact moderation is a risk/spam assessment, not identity proof. Email verification proves control of the mailbox, not legal identity.
- Contact messages are retained for 180 days by default. Restrict database access and do not log message bodies or credentials.
- The contact endpoint has an additional PostgreSQL-backed per-IP minute bucket, so its quota is shared across Vercel container instances. Other API route limits remain per instance; add gateway/WAF quotas before scaling those routes significantly.
