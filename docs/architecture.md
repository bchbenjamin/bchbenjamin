# Portfolio architecture

Next.js App Router serves the launcher, public pages, and same-origin API routes.
Public HTML uses 60-second ISR; mutations invalidate the public layout.
Neon PostgreSQL is accessed via its serverless driver. Admin operations use
Google OAuth, native database sessions, TOTP and CSRF protection.
Public read models enforce publication and attachment visibility server-side.
The browser renders the phone interaction locally.

For runtime, schema migration, operations and rollback, see
[BACKEND-MIGRATION.md](../BACKEND-MIGRATION.md).
