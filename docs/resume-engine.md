# Private ATS resume engine

## Privacy contract

There is no public resume endpoint, page, static PDF or public object-storage URL. The generator reads private source records and writes the output into owner-only generation history. Every route is under `/api/v1/admin/resumes/**` and protected by the owner OIDC session and `ROLE_ADMIN`.

## Modes

- `GENERAL`: render the complete verified profile.
- `JOB_DESCRIPTION`: compare a supplied JD with verified records, select relevant evidence and render a tailored version.

The first template is `ats`, a single-column A4 layout with standard section headings and selectable text.

## Evidence integrity

The JD model is an evidence selector, not a free-form resume writer. It returns UUIDs from the supplied profile snapshot and optionally maps requirements to those IDs. The API validates every returned ID against the relevant source collection. The renderer then uses the original stored text. Unknown identifiers are discarded. If AI configuration is absent or invalid, deterministic keyword-overlap selection is used.

The generator never creates new employers, role titles, education, dates, credentials, skills or numeric impact claims. The stored generation record includes the job description, source snapshot, selection, match report, model identifier, rendered PDF and timestamp.

## API

- `POST /api/v1/admin/resumes/generate` — `{ "mode": "general|job", "jobDescription": "...", "templateId": "ats" }`
- `GET /api/v1/admin/resumes` — private generation history metadata.
- `GET /api/v1/admin/resumes/{id}/download` — owner-authenticated PDF attachment, `Cache-Control: no-store`.
- `DELETE /api/v1/admin/resumes/{id}` — remove a private version.

There is intentionally no `/api/v1/public/resume.pdf` or Next.js `/resume` route.

## AI provider configuration

The backend accepts an OpenAI-compatible chat-completions URL:

- `RESUME_AI_BASE_URL`
- `RESUME_AI_API_KEY`
- `RESUME_AI_MODEL`

All three are optional; without them the deterministic selector is used. These values must remain server-side and must never use `NEXT_PUBLIC_` prefixes.

## Design references reviewed

The implementation borrows architectural patterns rather than importing a second resume application:

- [Tailored](https://github.com/end1989/tailored): canonical profile as source of truth, content integrity checks and preventing unsupported claims.
- [ATS Engine](https://github.com/VeriWorkly/ats-engine): deterministic requirement matching and evidence-backed fit reporting.
- [CVTailor](https://github.com/Kiranism/cvtailor): live-editing workflow and parser-friendly single-column layout.

These repositories are references only; this service stays within the native Next.js backend.

## Validation

The integration suite verifies that the former public PDF URL returns 404, the private history endpoint rejects anonymous access, and the PDF service can render a real PDF from private records. Before a real application is submitted, inspect the generated PDF visually and extract its text to verify layout and ATS readability.
