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
Next.js 16 / TypeScript ─────────────── Vercel
   │                                  bchbenjamin.in
   │ HTTPS API
   ▼
Java 21 / Spring Boot ──────────────── Render
   │                                  api.bchbenjamin.in
   ├── PostgreSQL + Flyway
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

- **Vercel:** import the repository root (`.`) as a Next.js project. Set `API_BASE_URL` and `NEXT_PUBLIC_API_BASE_URL` to the Render API origin.
- **Render:** apply the root `render.yaml` Blueprint. It defines the Docker-based Spring Boot API and managed PostgreSQL database. Review paid plans, region and prompted secrets before provisioning.
- **Backend secrets:** OAuth credentials, AI pipeline key, Gmail SMTP App Password, token-encryption key and admin OIDC allowlist belong only in Render environment secrets.
- **Domain:** point `bchbenjamin.in` to Vercel and `api.bchbenjamin.in` to Render.

See [deployment runbook](docs/deployment.md), [contact workflow](docs/contact-mail-architecture.md), [authentication](docs/authentication.md), [security operations](docs/security-operations.md) and [agent access](docs/agent-access-mcp.md).

### Automation

GitHub Actions refreshes the bounded recent-public-repositories section above every day. The updater cannot overwrite the manually maintained profile sections. CI separately runs frontend quality checks, backend integration tests and secret scanning.

</details>

<div align="center">

*Thoughtfully built. Constantly iterating.*

</div>
