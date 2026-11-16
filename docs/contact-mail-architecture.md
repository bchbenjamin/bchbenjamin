# Proposed AI-screened contact form and reply routing

Status: **design only**. The public `/contact` page currently provides mailto links; there is no form submission, AI screening, SMTP integration, or inbound reply automation yet.

## Flow

1. Visitor enters display name, organization (optional), email address, subject and message. Include a clear privacy notice and a honeypot; use CAPTCHA/Turnstile and rate limits to resist automated abuse.
2. Backend validates input lengths and format, sanitizes rendered output, applies per-IP and per-address quotas, and creates a `PENDING_SCREENING` contact record. Never accept arbitrary SMTP recipients from callers.
3. Call the configured AI pipeline (`CONTACT_AI_BASE_URL`, `CONTACT_AI_API_KEY`, `CONTACT_AI_MODEL`) **server-side** with a strict schema: `allow | review | reject`, confidence and reason. AI can flag spam, impersonation patterns, phishing and abusive content, but **cannot establish that a name belongs to a real person or organization**. Do not reject a legitimate sender solely because a name is unknown. Prefer human review for ambiguous cases.
4. Verify the sender controls the address via a one-time email confirmation before delivery, or otherwise mark the email as unverified. An AI check is not email ownership verification.
5. For approved messages, send through an SMTP account under the sender account's own authenticated address (e.g. an alternate Gmail account with 2-Step Verification and an app password, where available). The **To** address is the primary inbox `bchbenjamin@gmail.com`; set **Reply-To** to the verified visitor email; optionally **Cc** the sending account. Put the submitted name and subject in the message body and use a fixed subject prefix and message ID. Do not set **From** to the visitor's email (spoofing/SPF/DMARC risk).
6. When the owner presses **Reply** in the primary Gmail inbox, the mail client normally uses the visitor's **Reply-To**, sending directly from the primary account to the visitor. **Reply All** can include the alternate sender if it was CC'd, depending on mail-client behavior. No inbound webhook or automated reply processor is required for this normal email reply workflow.
7. Store only necessary contact metadata, screening decision and delivery status, and define retention/deletion. Never log API keys, app passwords or full private message bodies. Provide a non-AI fallback if the screening provider is unavailable.

## Suggested boundaries

- Next.js on Vercel: contact form UI and optional same-origin proxy endpoint, no SMTP or AI secrets in client bundles.
- Spring Boot API: validation, throttling, AI screening, verification, message persistence and SMTP dispatch; enqueue asynchronous delivery for resilience.
- PostgreSQL: contact submissions, verification tokens (hashed), delivery state and audit metadata.
- External SMTP: authenticated Gmail alternate account (or a transactional email provider as volume grows).

A Gmail app password is **not** a general-purpose API key. Enable 2-Step Verification, use an app password only if the account supports it, and store it as a backend secret. Gmail sending limits and anti-abuse rules apply. Avoid creating an open mail relay.

## Deployment caveats

Spring Boot, persistent sessions, PostgreSQL/Flyway, Java PDF generation, and long-running mail/agent operations do not fit the existing Next.js Vercel frontend deployment as-is. Use a separate JVM-capable backend host (Render, another VM/container platform, or a private server). A **new Render account is not necessary**; separate services/projects and access controls are sufficient. Free Render services may sleep, so a scheduled ping is not a reliable availability strategy; use a paid always-on service or a genuinely always-on host for dependable delivery. Do not use synthetic cron traffic solely to circumvent free-tier inactivity policies.

Use `api.bchbenjamin.in` for the backend if possible. Configure CORS, HTTPS, secure cookies and OAuth callback origins for the frontend/backend split.
