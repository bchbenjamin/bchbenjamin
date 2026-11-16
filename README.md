# Benjamin — Software, AI & Systems

<div align="center">

[![Website](https://img.shields.io/badge/WEBSITE-bchbenjamin.in-6798ff?style=flat-square)](https://bchbenjamin.in)
[![GitHub](https://img.shields.io/badge/GITHUB-bchbenjamin-181717?style=flat-square&logo=github)](https://github.com/bchbenjamin)
[![CI](https://github.com/bchbenjamin/bchbenjamin/actions/workflows/ci.yml/badge.svg)](https://github.com/bchbenjamin/bchbenjamin/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)

**Computer Science & Engineering · Applied AI · Data · Edge Computing**

*I build useful software for complex, real-world problems.*

</div>

---

## About

I’m Benjamin, a Computer Science & Engineering student interested in the space between intelligent systems and thoughtful product engineering.

My work spans full-stack applications, applied machine learning, data workflows and edge devices. I enjoy taking a problem from an early idea through architecture, implementation and testing — while keeping the resulting software practical and maintainable.

I’m especially interested in:

- **Applied AI:** machine learning and language technologies used to solve concrete problems.
- **Edge systems:** bringing useful computation closer to the device, within real hardware constraints.
- **Product engineering:** building dependable applications with clear interfaces and sensible architecture.
- **Developer tooling:** small, focused tools that make everyday work easier.

## Selected work

| Project | What it explores | Stack |
| --- | --- | --- |
| [AWARESPAN](https://github.com/awarespan/node-core-processing) | An AI-powered safety device with local threat detection and connected alerts on edge hardware. | Python · Raspberry Pi · Computer Vision |
| [Siddhi](https://github.com/bchbenjamin/siddhi) | A role-aware platform with student and guardian experiences, reports and backend integration. | Next.js · TypeScript · React |
| [AI-IDA](https://github.com/bchbenjamin/AI_IDA) | Detection of suspicious internship and job opportunities using message metadata and NLP. | Python · NLP · Classification |
| **ClipZ** | A lightweight desktop video editor designed for low-spec PCs and minimal dependencies. | Python · Tkinter |

More detail, project notes and current work live on the [portfolio website](https://bchbenjamin.in).

## Engineering interests

~~~text
PRODUCT & WEB     TypeScript · JavaScript · React · Next.js · HTML · CSS
AI & DATA         Python · Machine Learning · NLP · Data Analytics
SYSTEMS & TOOLS   Java · Linux · Git · Raspberry Pi · Edge Computing
~~~

I value clear interfaces, honest technical trade-offs, small deployable increments and tests that prove the intended behaviour.

## A few milestones

- **Chess:** U-19 Bengaluru Urban District Boys’ runner-up, 2024.
- **Community:** Chess.com Ambassador.
- **Academics:** 9.00 SGPA in Semester 4.
- **Engineering:** OpenFOAM internship through FOSSEE.

## This repository

This is the special GitHub profile repository for **bchbenjamin**, and the source for [bchbenjamin.in](https://bchbenjamin.in).

The platform is a Next.js application backed by a Java/Spring Boot REST API and PostgreSQL. PostgreSQL is the canonical source of truth for portfolio content; LinkedIn is a publishing destination, not a profile database. The implementation is being delivered in phases so the public site, CMS, authentication, resume publishing and integrations share one coherent data model.

### Architecture at a glance

~~~text
Next.js 16 · App Router · TypeScript
        │
        ├── Java 21 · Spring Boot REST API
        │       │
        │       └── PostgreSQL · Flyway migrations
        │
        ├── Public routes
        │     ├── /
        │     ├── /projects
        │     ├── /projects/[slug]
        │     ├── /experience
        │     ├── /resume
        │     └── /contact
        │
        ├── Public content
        │     ├── Spring Boot published read API
        │     └── src/data/site.json fallback snapshot
        │
        ├── UI and motion
        │     ├── Tailwind CSS v4 + Dovetail theme tokens
        │     ├── Framer Motion
        │     ├── GSAP ScrollTrigger
        │     ├── Lenis
        │     └── WebGL hero accent
        │
        └── Delivery
              ├── GitHub Actions quality gates
              └── Vercel deployment
~~~

### Local development

**Requirements:** Node.js 22.12 or newer (Node.js 24 is used in CI).

~~~bash
git clone https://github.com/bchbenjamin/bchbenjamin.git
cd bchbenjamin
npm ci
npm run dev
~~~

Open http://localhost:3000.

The API requires Java 21. To start the local PostgreSQL service and API:

~~~bash
docker compose -f infra/compose.yaml up -d postgres
./mvnw -f backend/pom.xml spring-boot:run
~~~

The API health endpoint is http://localhost:8080/api/v1/health. See [the architecture notes](docs/architecture.md) for the system boundaries and local setup.

### Quality gates

Run the same checks required before a push:

~~~bash
npm run lint
npm run typecheck
npm test
npm run build
~~~

The GitHub Actions workflow runs the full sequence and a Gitleaks secret scan on pushes and pull requests targeting main.

### Deployment

The project is designed for Vercel and uses the repository root as its build root.

- Framework: Next.js
- Install: npm ci
- Build: npm run build
- Output: Next.js default output
- Node.js: 24.x
- Server-side public API origin: `API_BASE_URL`
- Browser-side admin API origin: `NEXT_PUBLIC_API_BASE_URL`
- Backend OAuth credentials, exact OIDC subject allowlist, CORS origins and secure cookie settings are documented in `.env.example` and `docs/authentication.md`

The Vercel Hobby plan is intended for personal, non-commercial use. The site is a personal portfolio and does not include ads, sponsorships or paid features.

### Phased implementation

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Foundation: Next.js, Spring Boot, PostgreSQL, Docker, environment configuration and CI | Complete |
| 2 | Core CMS: relational content schema, seed data, public read API and owner-only CRUD | Complete |
| 3 | Google/LinkedIn OIDC, Spring Security, sessions, admin authorization and audit logging | Code complete; provider setup pending |
| 4 | Refined public portfolio experience and database-backed pages | In progress |
| 5 | ATS-first resume engine, HTML/CSS rendering, PDF generation and long/short/resume variants | In progress |
| 6 | LinkedIn OAuth, encrypted token storage, review queue and explicit publishing | In progress |
| 7 | Scoped REST/MCP agent connectors, hashed API keys and human approval queue | In progress |
| 8 | OWASP hardening, rate limits, secret handling, logging and recovery checks | Planned |
| 9 | Production deployment, domain, monitoring and operational verification | Deferred by request |

The detailed implementation plan remains the source of truth for scope, security constraints and phase completion criteria.

## Contact

- Website: [bchbenjamin.in](https://bchbenjamin.in)
- GitHub: [@bchbenjamin](https://github.com/bchbenjamin)
- Email: [me@bchbenjamin.in](mailto:me@bchbenjamin.in)

---

<div align="center">

*Thoughtfully built. Constantly iterating.*

</div>
