# bchbenjamin.in

Portfolio site, and later an ATS resume engine, built as a single Next.js app on
Vercel. No separate backend.

## Status: Phase 0 — scaffold

The public site renders from `src/content/site.json`. There is no database, auth
or admin surface yet; Phase 1 replaces the JSON loader with reads through a
read-only Postgres role and turns on ISR.

`src/content/site.json` is **placeholder copy** (project descriptions, roles,
dates). Replace it with real data before the site goes live.

## Stack

- Next.js 16 (App Router, TypeScript `strict`)
- Tailwind CSS v4, with the Dovetail tokens in `src/app/theme.css`
- `react-markdown` + `rehype-sanitize` for stored markdown (no raw HTML)
- Vitest for unit tests
- GitHub Actions: lint, typecheck, test, build, gitleaks

## Scripts

```bash
npm run dev        # local dev server
npm run lint       # eslint .
npm run typecheck  # next typegen && tsc --noEmit
npm test           # vitest run
npm run build      # next build
```

Before pushing: `npm run lint && npm run typecheck && npm test && npm run build`.

## Environment

Phase 0 reads no environment variables, so the site runs with no env file at
all. `.env.example` documents every variable the project reads, grouped by the
phase that adds it:

```bash
cp .env.example .env.local
```

`.env.local` is git-ignored and must never be committed; `.env.example` holds
placeholders only. On Vercel, set the same names under Project → Settings →
Environment Variables. Nothing secret may use the `NEXT_PUBLIC_` prefix, because
those values are inlined into the browser bundle.

## Layout

```
src/
  app/
    (public)/           /, /projects, /projects/[slug], /experience, /contact
    theme.css           Dovetail design tokens
    globals.css         Tailwind entry + base styles
  components/           header, footer, section, project card, markdown
  content/site.json     Phase 0 content source
  lib/
    content/            content model, JSON validation and public queries
    format.ts           yyyy-mm date formatting
```

Content shapes mirror the planned database tables (`item`, `item_url`, `bullet`,
`skill`), so Phase 1 can swap the data source without touching pages. Every
public query filters on `isPublic`; a non-public item is not reachable by slug.

## Design rules

- Cards are `#141414` on a `#0b0b0b` page, separated by 1px `#313131` borders.
- No box-shadows. `#6798ff` is a text, border and underline colour only, never a
  fill.
- Motion animates transform and opacity only and respects
  `prefers-reduced-motion`.

## Deployment

Vercel project serving `bchbenjamin.in` over HTTPS. Phase 0 reads no environment
variables; the runtime environment variables listed in the implementation plan
arrive with the database and auth phases.
