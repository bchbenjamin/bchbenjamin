<div align="center">

# B C H Benjamin

### Software Engineering · Applied AI · Data · Edge Systems

I build practical software for complex, real-world problems — from full-stack products to intelligent systems running on constrained hardware.

[**Portfolio ↗**](https://bchbenjamin.in) · [GitHub](https://github.com/bchbenjamin) · [Contact](https://bchbenjamin.in/contact)

[![Website](https://img.shields.io/badge/website-bchbenjamin.in-9bb9ff?style=flat-square)](https://bchbenjamin.in)
[![GitHub](https://img.shields.io/badge/GitHub-bchbenjamin-181717?style=flat-square&logo=github)](https://github.com/bchbenjamin)
[![CI](https://github.com/bchbenjamin/bchbenjamin/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/bchbenjamin/bchbenjamin/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://www.java.com)

</div>

---

## About

I'm a Computer Science & Engineering student interested in the space between intelligent systems and thoughtful product engineering. My work spans full-stack applications, applied machine learning, data workflows, developer tooling and edge devices.

I enjoy taking a problem from its first constraints through architecture, implementation and testing. I care about the parts behind the interface too: performance, maintainability, security and the trade-offs that make software dependable.

**Current interests**

- **Applied AI:** machine learning and language technologies that solve concrete problems.
- **Edge computing:** useful inference and processing within real hardware and resource constraints.
- **Product engineering:** coherent interfaces backed by maintainable systems.
- **Developer infrastructure:** APIs, automation and tools that make other engineering work easier.

## Selected work

| Project | Focus | Technologies |
| --- | --- | --- |
| [AWARESPAN](https://github.com/awarespan/node-core-processing) | AI-powered safety device with local threat detection and connected alerts on edge hardware. | Python · Raspberry Pi · Computer Vision |
| [Siddhi](https://github.com/bchbenjamin/siddhi) | Role-aware platform with student and guardian experiences, reports and backend integration. | Next.js · TypeScript · React |
| [AI-IDA](https://github.com/bchbenjamin/AI_IDA) | Detection of suspicious internship and job opportunities using message metadata and NLP. | Python · NLP · Classification |
| **ClipZ** | Lightweight desktop video editor designed for low-spec PCs and minimal dependencies. | Python · Tkinter |

More project details, engineering notes and the current portfolio are available at **[bchbenjamin.in](https://bchbenjamin.in)**.

## Engineering toolkit

| Area | Tools and technologies |
| --- | --- |
| Languages | Java · Python · TypeScript · JavaScript · SQL |
| Web | React · Next.js · HTML · CSS · Tailwind CSS |
| Backend | Spring Boot · REST APIs · PostgreSQL · Docker |
| AI & data | Machine Learning · NLP · Data Analytics |
| Systems | Linux · Raspberry Pi · Git · Edge Computing |

I choose tools around the problem rather than forcing every problem into the same stack.

## Milestones

- **Chess:** U-19 Bengaluru Urban District Boys' runner-up, 2024.
- **Community:** Chess.com Ambassador.
- **Academics:** 9.00 SGPA in Semester 4.
- **Engineering:** OpenFOAM internship through FOSSEE.

## Deploy to Vercel

This repository is configured as **one Vercel Services project** containing the Next.js website and the Java 21 / Spring Boot API. It is not a frontend-only deployment. Both services are built from the same `main` branch and served through `bchbenjamin.in`.

### Create the Vercel project

1. In Vercel, import **`bchbenjamin/bchbenjamin`** and select the **`main`** branch. The deployment configuration is committed to `main`.
2. Keep the **Root Directory** as `./` (the repository root). Do not set it to `backend/`.
3. In **Application Preset**, select **Services** if it is offered in the import wizard. If the wizard only shows **Other**, complete project creation first, then open **Project Settings → Build & Development Settings → Framework Preset**, select **Services**, and save. Services mode is required for the `services` block in `vercel.json`; leaving the project on Other or Next.js alone will not build both services.
4. Redeploy the latest `main` commit after changing the preset. The project should show two services: `frontend` (Next.js) and `backend` (Java container using `backend/Dockerfile.vercel`).
5. Keep the project root at `./`. The root `vercel.json` owns the routing: API, OAuth, MCP and health paths go to Spring Boot; the remaining paths go to Next.js.

### Connect the database and configure environment

1. Provision PostgreSQL (Neon via the Vercel Marketplace is the recommended starting point). Configure the pooled connection as `DATABASE_URL` and the direct connection as `DATABASE_URL_UNPOOLED` so runtime queries and Flyway migrations use the correct connection types.
2. Add the production environment variables and secrets listed in [`docs/deployment.md`](docs/deployment.md). At minimum, this includes the database URLs, `DATABASE_POOL_SIZE=2`, `PORT=8080`, the public site URLs, session settings, OAuth credentials and allowlist, AI moderation credentials, SMTP credentials, `TOKEN_ENCRYPTION_KEY`, `CONTACT_IP_HASH_SALT` and `CRON_SECRET`. Never commit secret values or expose them through `NEXT_PUBLIC_*`.
3. Register these OAuth callback URLs with the identity providers:
   - `https://bchbenjamin.in/login/oauth2/code/google`
   - `https://bchbenjamin.in/login/oauth2/code/linkedin`
   - `https://bchbenjamin.in/login/oauth2/code/linkedin-publisher`
4. Add `bchbenjamin.in` and `www.bchbenjamin.in` to the Vercel project and apply the DNS records Vercel provides.
5. Deploy and verify the public site, `/actuator/health`, OAuth login and persistent sessions, resume PDF, contact email verification, AI moderation, owner notification and admin review queue before treating the deployment as production-ready.

**Important:** Vercel Services and its container runtime are beta features. They are not a promise of zero-cost hosting; check current usage limits and billing. PostgreSQL is a separate managed service. If you prefer a conventional always-on backend, [`render.yaml`](render.yaml) and the Render fallback in the deployment runbook remain available.

Full environment-variable descriptions, database behavior, SMTP setup, cron behavior and the Render alternative are documented in [`docs/deployment.md`](docs/deployment.md).

## Recently updated public repositories

<!-- PROFILE_ACTIVITY_START -->
- Repository activity is refreshed automatically by GitHub Actions.
<!-- PROFILE_ACTIVITY_END -->

## Get in touch

For engineering discussions, collaboration or a worthwhile problem to solve, reach me through the [contact form](https://bchbenjamin.in/contact) or at [me@bchbenjamin.in](mailto:me@bchbenjamin.in).

---

<details>
<summary>About this repository</summary>

This is the special GitHub profile repository for **bchbenjamin** and the source code for [bchbenjamin.in](https://bchbenjamin.in).

### Platform architecture

```text
Visitors
   │
   ▼
Next.js 16 / TypeScript ─────────────── Vercel frontend service
   │                                  bchbenjamin.in
   │ Vercel service routing
   ▼
Java 21 / Spring Boot ──────────────── Vercel container service
   │
   ├── Managed PostgreSQL + Flyway + JDBC sessions
   ├── Owner-only CMS / OIDC
   ├── Resume PDF generation
   ├── Scoped REST + MCP agent access
   ├── AI-screened contact workflow
   └── Gmail SMTP verification + notifications
```

### Contact workflow

Contact submissions are screened through the configured AI pipeline, verified through a one-time email link and delivered to the owner inbox only after approval. Uncertain submissions enter the owner review queue. Notification messages use the sender's verified email as `Reply-To`, allowing a direct reply from the primary Gmail inbox. AI screening is a risk assessment, not proof of real-world identity.

### Local development

Requirements: Node.js 24 and Java 21.

```bash
git clone https://github.com/bchbenjamin/bchbenjamin.git
cd bchbenjamin
npm ci
npm run dev
```

Start the backend and local PostgreSQL:

```bash
docker compose -f infra/compose.yaml up -d postgres
./mvnw -f backend/pom.xml spring-boot:run
```

### Deployment

- **Vercel:** import the `main` branch, keep the repository root as `./`, and set the project Framework Preset to **Services** in Project Settings. The import wizard may initially show Other; the Services preset is mandatory for both applications to build. Follow the [deployment steps above](#deploy-to-vercel).
- **Database:** provide an external PostgreSQL connection string (Neon is a suitable serverless option). JDBC-backed sessions preserve admin logins across container scale-down.
- **Secrets:** OAuth credentials, AI pipeline key, Gmail SMTP App Password, token-encryption key, cron secret and admin OIDC allowlist belong in Vercel environment secrets.
- **Domain:** point `bchbenjamin.in` to Vercel. No separate API subdomain is required for the multi-service setup.
- **Render fallback:** use `render.yaml` if you prefer an always-on API service instead of the Vercel beta container runtime.

See [deployment runbook](docs/deployment.md), [contact workflow](docs/contact-mail-architecture.md), [authentication](docs/authentication.md), [security operations](docs/security-operations.md) and [agent access](docs/agent-access-mcp.md).

### Automation

GitHub Actions refreshes the bounded recent-public-repositories section above every day. The updater cannot overwrite the manually maintained profile sections. CI separately runs frontend quality checks, backend integration tests and secret scanning.

</details>

<div align="center">

*Thoughtfully built. Constantly iterating.*

</div>
