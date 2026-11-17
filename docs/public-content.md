# Public site data flow

The public site consumes a dedicated Spring Boot read model. It does not fetch private CMS records and does not hide confidential fields in the browser.

## Publication rules

- A row must be marked `published` to appear in a public collection.
- Each field must be explicitly allowed by the row's `public_fields` JSONB object. `{"*":true}` is reserved for compatibility and should not be used for new records.
- Custom field values are returned only when `public_fields["customFields.<key>"]` is true.
- The public API excludes internal identifiers, field metadata, custom values by default, audit data and resume-only descriptions.
- Uploaded assets are private until their visibility is explicitly changed to `PUBLIC`.
- Gallery images require both a published achievement and a public image asset connected through `media_relationships`.
- Site configuration is served from `site_configuration.published_config`; draft values are never exposed through public APIs.

## Endpoints

- `GET /api/v1/public/profile`
- `GET /api/v1/public/projects`
- `GET /api/v1/public/projects/{slug}`
- `GET /api/v1/public/experience`
- `GET /api/v1/public/education`
- `GET /api/v1/public/skills`
- `GET /api/v1/public/achievements`
- `GET /api/v1/public/site-configuration`
- `GET /api/v1/public/media/{id}` (public image assets only)

## Frontend fallback policy

The local `src/data/site.json` is a development fallback only when the application is running without a configured API origin. When an API origin is configured but the live profile cannot be loaded, the public frontend renders an empty safe model. It does not reintroduce stale, previously published content from the static snapshot.

## Owner publishing workflow

The owner edits career records, per-field visibility, custom parameters, media and homepage configuration in `/admin`. Site configuration saves to a draft first; the public site changes only after an explicit publish action.
