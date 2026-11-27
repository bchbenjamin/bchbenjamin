# Deployment

Use a single Vercel project with the Next.js framework preset, repository root,
and the default Next.js build command. No Java service or container is required.
Use the existing Neon database. Configure the variables listed in
[.env.example](../.env.example), including production Google OAuth and the existing
TOTP encryption key. Set FRONTEND_URL to the canonical HTTPS domain.
Leave API_BASE_URL and NEXT_PUBLIC_API_BASE_URL unset for same-origin API access.
Apply pending additive SQL migrations using npm run db:migrate before deployment.
For development use npm ci and npm run dev. Run the quality checks in CI before
promoting a release. See [BACKEND-MIGRATION.md](../BACKEND-MIGRATION.md).
