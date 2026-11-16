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

The website is a single Next.js application. Phase 0 is intentionally static and data-driven; later phases add the database-backed public read path, owner-only admin, ATS resume engine, LinkedIn publishing, AI connectors and Telegram workflow described in the implementation plan.

### Architecture at a glance

~~~text
Next.js 16 · App Router · TypeScript
        │
        ├── Public routes
        │     ├── /
        │     ├── /projects
        │     ├── /projects/[slug]
        │     ├── /experience
        │     ├── /resume
        │     └── /contact
        │
        ├── Local content (Phase 0)
        │     └── src/data/site.json
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
- Runtime environment variables: none required for Phase 0

The Vercel Hobby plan is intended for personal, non-commercial use. The site is a personal portfolio and does not include ads, sponsorships or paid features.

### Phased implementation

| Phase | Scope | State |
| --- | --- | --- |
| 0 | Scaffold, public static pages, theme, CI and first deployment | Current |
| 1 | Neon Postgres, Drizzle, role-separated access and public views | Planned |
| 2 | Better Auth, provider-subject allowlist and hidden owner login | Planned |
| 3 | Admin CRUD, audit trail and cache revalidation | Planned |
| 4 | ATS-first DOCX resume generation and publishing | Planned |
| 5 | Deterministic job-description matching and editable tailoring | Planned |
| 6 | LinkedIn OAuth, manual announcement review and publishing | Planned |
| 7 | Scoped REST and MCP connectors with a human approval queue | Planned |
| 8 | Telegram webhook and daily Vercel cron | Planned |
| 9 | Security hardening, restore drill and operational checks | Planned |

The detailed implementation plan remains the source of truth for scope, security constraints and phase completion criteria.

## Contact

- Website: [bchbenjamin.in](https://bchbenjamin.in)
- GitHub: [@bchbenjamin](https://github.com/bchbenjamin)
- Email: [me@bchbenjamin.in](mailto:me@bchbenjamin.in)

---

<div align="center">

*Thoughtfully built. Constantly iterating.*

</div>
