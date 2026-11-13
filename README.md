# bchbenjamin.in

Portfolio site and resume engine, built as a single Next.js app on Vercel. No
separate backend.

## Status

| Phase | What | State |
| --- | --- | --- |
| 0 | Scaffold, Dovetail palette, public pages, CI | done |
| 1 | Postgres schema, read-only role, public views, ISR | done |
| 2 | Owner sign-in (Better Auth) and protected admin | done |
| 3 | Admin item create / edit / delete | done |
| 4 | Resume page, `.docx` download, published snapshots | done |
| 5 | LinkedIn announcement, Telegram, AI connector | not built |

`src/content/site.json` is still **placeholder copy**. It is the fallback source
of truth until `DATABASE_URL_APP` is set and the seed has run.

## Stack

- Next.js 16 (App Router, TypeScript `strict`, Turbopack)
- Tailwind CSS v4 with Dovetail tokens in `src/app/theme.css`
- Drizzle ORM on Neon Postgres, three roles: `app_read`, `app_admin`, migrate
- Better Auth 1.7, email and password, sign-up disabled
- `docx` for the resume download, `react-markdown` + `rehype-sanitize` for posts
- Vitest, GitHub Actions (lint, typecheck, test, build, gitleaks)

## Setup

```bash
npm install
cp .env.example .env.local     # fill in the values
```

Database, in order — each uses `DATABASE_URL_MIGRATE`:

```bash
npm run db:migrate        # drizzle-kit migrate, then the public views
npm run db:roles          # creates/rotates app_read and app_admin
npm run db:seed           # seeds the tables from src/content/site.json
```

Then point `DATABASE_URL_APP` and `DATABASE_URL_ADMIN` at the two role
connection strings and create the only account:

```bash
npm run auth:create-owner # uses OWNER_EMAIL and OWNER_PASSWORD once
```

Without `DATABASE_URL_APP` the site still builds and runs, serving the
checked-in JSON. That is what keeps CI green and fresh clones usable.

## Scripts

```bash
npm run dev               # local dev server
npm run lint              # eslint .
npm run typecheck         # next typegen && tsc --noEmit
npm test                  # vitest run
npm run build             # next build
npm run db:generate       # regenerate the Drizzle migration after a schema edit
npm run db:migrate        # apply migrations, then drizzle/sql/*.sql
npm run db:roles          # create or rotate the runtime roles
npm run db:seed           # seed content from src/content/site.json
npm run auth:create-owner # create the owner account or reset its password
```

Before pushing: `npm run lint && npm run typecheck && npm test && npm run build`.

## Environment

`.env.example` documents every variable, grouped by the phase that reads it.
`.env.local` is git-ignored and must never be committed; `.env.example` holds
placeholders only. On Vercel, set the same names under Project → Settings →
Environment Variables. Nothing secret may use the `NEXT_PUBLIC_` prefix.

The Neon driver needs a global `WebSocket`, so the app requires Node 22+.

## Security model

- The public site reads only through `app_read`, which is granted `SELECT` on the
  `public_profile`, `public_item`, `public_skill` and `public_resume` views and
  nothing else. Non-public items are filtered inside the view, not in app code.
- Every admin page, server action and route handler calls `requireOwner()`.
  `src/proxy.ts` only redirects when the session cookie is missing; it is UX,
  never authorisation.
- Sign-up is disabled in the running app. The owner account is created by script.
- Every file touching the database, sessions or secrets starts with
  `import "server-only"`.
- Markdown renders without raw HTML and through `rehype-sanitize`.
- Session cookies are `Secure` in production; session data lives in Postgres, so
  revocation is immediate.

## Layout

```
drizzle/                  generated migrations + drizzle/sql public views
scripts/                  migrate/roles/seed and owner creation (plain node)
src/
  app/
    (public)/             /, /projects, /projects/[slug], /experience, /resume,
                          /resume/download, /contact
    (admin)/              /admin, /admin/items/*, /admin/resume
    api/auth/[...all]/    Better Auth handler
    login/                owner sign-in
  components/             header, footer, section, cards, markdown
  content/
    repository.ts         DB-or-JSON content source (server only)
    site.json             fallback content
  db/                     schema, clients per role, reads, writes, mapping
  lib/
    auth/                 Better Auth options, session guards
    content/              model, validation, selectors, item form parsing
    resume/               resume builder and .docx document
    format.ts             yyyy-mm formatting
```

## Design rules

- Cards are `#141414` on a `#0b0b0b` page, separated by 1px `#313131` borders.
- No box-shadows. `#6798ff` is a text, border and underline colour only, never a
  fill.
- Motion animates transform and opacity only and respects
  `prefers-reduced-motion`.

## Deploy

Vercel project serving `bchbenjamin.in` over HTTPS. Set the variables from
`.env.example`, run the database scripts once against the production database,
then deploy.
