# AI-screened contact and reply workflow

Status: **implemented; provider credentials and deployment remain to be configured**.

## Flow

1. Visitor submits name, optional organisation, email, subject and message. The browser includes a hidden honeypot field. The API validates lengths and email syntax, limits submissions per IP and stores only a salted hash of the source IP.
2. The backend sends the submission to the configured OpenAI-compatible AI pipeline using `CONTACT_AI_BASE_URL`, `CONTACT_AI_API_KEY`, `CONTACT_AI_MODEL` and optional `CONTACT_AI_PATH`. The API key is server-only. The model returns `APPROVE`, `REVIEW` or `REJECT`, confidence, risk score and concise reasoning.
3. AI approval is deliberately conservative (confidence at least 0.90 and risk score at most 20). Clear spam can be rejected; uncertain or unavailable screening goes to `PENDING_REVIEW`. The model may assess plausibility and consistency of the supplied name/organisation, but cannot prove that a real-world person or organisation exists or that the sender represents it.
4. Non-rejected submissions receive a one-time email verification link. The token is random, stored only as a SHA-256 hash, expires after 24 hours and is consumed once. This proves control of the supplied email address, not the sender's identity.
5. After email verification, AI-approved submissions trigger an inbox notification. AI-review submissions remain in `/admin` until the owner approves or rejects them. The owner-only contact panel can retry failed notifications.
6. The backend container (Vercel primary, Render fallback) sends using the authenticated alternate Gmail account (`SMTP_USERNAME` / `SMTP_APP_PASSWORD`) to `CONTACT_INBOX_EMAIL` (default `bchbenjamin@gmail.com`). `From` is the authenticated sender; `Reply-To` is the verified visitor address. The owner can press Reply in Gmail and the reply goes directly to the visitor from the primary Gmail account. `CONTACT_NOTIFICATION_CC` optionally copies another mailbox on the initial notification.

No inbound SMTP server, Gmail watch, webhook or reply relay is needed for this direct-reply workflow. Gmail SMTP is outbound-only here.

## Required deployment secrets

- `CONTACT_AI_BASE_URL`: base URL for the user's OpenAI-compatible AI pipeline.
- `CONTACT_AI_API_KEY`: API key for that pipeline.
- `CONTACT_AI_MODEL`: model identifier accepted by the pipeline.
- `CONTACT_AI_PATH`: optional endpoint path; defaults to `/v1/chat/completions`.
- `SMTP_USERNAME`: alternate Gmail address used to authenticate SMTP.
- `SMTP_APP_PASSWORD`: Google App Password for that Gmail account (where supported; never the normal account password).
- `CONTACT_FROM_EMAIL`: should match the authenticated Gmail sender.
- `CONTACT_INBOX_EMAIL`: primary inbox, default `bchbenjamin@gmail.com`.
- `CONTACT_NOTIFICATION_CC`: optional mailbox copied on initial notification.
- `CONTACT_IP_HASH_SALT`: generated secret used to salt stored IP hashes.
- `CRON_SECRET`: Vercel project secret used to authenticate the daily maintenance invocation. The Render fallback uses the in-process scheduler instead.

Enable 2-Step Verification before creating a Google App Password. Google may not offer App Passwords for every account or account policy. If unavailable, use a transactional email provider with an API instead of attempting to bypass Gmail security.

## Operational notes

- If the AI pipeline is missing or unavailable, the API fails closed to owner review; it does not automatically notify the inbox.
- If SMTP fails, the submission is marked `VERIFICATION_FAILED` or `DELIVERY_FAILED`; the admin panel exposes delivery retry for notification failures.
- The contact submission table stores the message body and moderation metadata. Records are automatically purged after 180 days by default (`CONTACT_RETENTION_DAYS`). Restrict database access and configure backups. Do not log message bodies or credentials.
- The public contact API has a per-instance filter limit plus a PostgreSQL-backed per-IP minute bucket shared across Vercel instances, and a honeypot. A maintenance task recovers stuck notification attempts and purges old submissions. Add a CAPTCHA/Turnstile provider if abuse patterns justify it.
- Never accept a caller-supplied destination inbox or sender address for SMTP. The configured inbox is fixed server-side.
- AI output is untrusted. It can flag risk and plausibility, not establish identity or make legal/factual guarantees.
