<div align="center">

# B C H Benjamin

**Computer Science & Engineering · Software Development · Applied AI · Edge Computing**

I build practical software, intelligent systems and tools that solve real problems.

[Portfolio](https://bchbenjamin.in) · [GitHub](https://github.com/bchbenjamin) · [Email](mailto:me@bchbenjamin.in)

</div>

## About me

I'm a Computer Science & Engineering student interested in full-stack engineering, applied machine learning, developer tools and efficient edge systems. I enjoy building projects end-to-end: understanding the problem, designing an architecture, writing the code and validating the result.

## Selected projects

| Project | Focus |
| --- | --- |
| [AWARESPAN](https://github.com/awarespan/node-core-processing) | AI-powered safety device, on-device threat detection and connected alerts |
| [Siddhi](https://github.com/bchbenjamin/siddhi) | Role-aware web application with student and guardian experiences |
| [AI-IDA](https://github.com/bchbenjamin/AI_IDA) | Detecting suspicious internships and job offers with NLP and structured data |
| ClipZ | Lightweight Python desktop video editor for modest hardware |

## What I work with

- **Languages:** Java, Python, TypeScript, JavaScript, SQL
- **Web & backend:** Next.js, React, Spring Boot, REST APIs, PostgreSQL
- **AI & systems:** NLP, machine learning, Raspberry Pi, Linux, Git

## Beyond the code

- Bengaluru Urban U-19 district chess runner-up (2024)
- Chess.com Ambassador
- Semester 4 SGPA: 9.00
- OpenFOAM / FOSSEE internship experience

## Recently updated public repositories

<!-- PROFILE_ACTIVITY_START -->
- [capstone-CP002-benjamin-yogeetha](https://github.com/bchbenjamin/capstone-CP002-benjamin-yogeetha)
- [SIP](https://github.com/bchbenjamin/SIP)
- [BAINB501](https://github.com/bchbenjamin/BAINB501)
- [hermes](https://github.com/bchbenjamin/hermes) — A personal Quiz website that helps users to learn quizzes well and score well in their 1-credit exams. Scalable for other MCQ-type exam prep
- [kmac](https://github.com/bchbenjamin/kmac)
<!-- PROFILE_ACTIVITY_END -->

## Get in touch

For collaboration, projects or technical discussions, visit [bchbenjamin.in](https://bchbenjamin.in) or email [me@bchbenjamin.in](mailto:me@bchbenjamin.in).

<details>
<summary>About this repository</summary>

This special GitHub profile repository also contains the source code for my portfolio platform:

- **Frontend:** Next.js 16 / TypeScript, designed for Vercel.
- **Backend:** Java 21 / Spring Boot, designed for an always-running Java service with PostgreSQL.
- **Content:** owner-only CMS, published content API, PDF resumes and reviewed agent integrations.
- **Operations:** GitHub Actions CI and a daily workflow that updates only the recent public repositories section of this README.

See [architecture](docs/architecture.md), [security operations](docs/security-operations.md), [agent access](docs/agent-access-mcp.md) and [authentication setup](docs/authentication.md).

**Local development:** `npm ci && npm run dev`; backend: `docker compose -f infra/compose.yaml up -d postgres && ./mvnw -f backend/pom.xml spring-boot:run`.

**Vercel setup:** import this repository with Root Directory `.` and framework Next.js. Set `API_BASE_URL` (server-side backend origin) and `NEXT_PUBLIC_API_BASE_URL` (browser-facing backend origin). `vercel.json` deliberately contains no secrets or backend deployment configuration.

The AI-screened contact form and outbound email workflow are planned, not yet deployed. Production credentials, domain routing, OAuth setup, database backups and backend hosting remain external deployment tasks.

</details>
