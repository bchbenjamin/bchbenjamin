# Public site data flow

The public Next.js pages read content from the Spring Boot public API at request time when `API_BASE_URL` is configured. The API only returns published rows. If the API is not configured or temporarily unavailable, the site uses the checked-in `src/data/site.json` snapshot so a first deploy can still render and so content outages do not produce a blank portfolio.

The following pages consume the CMS read model:

- Home: owner summary, featured projects and skill groups.
- Project index and project detail: published project descriptions and links.
- Experience: published experience and achievements.
- Resume profile preview: owner summary, skills, projects and experience.
- Contact: published owner contact details and public links.

`API_BASE_URL` is server-only and is not exposed to browser JavaScript. `NEXT_PUBLIC_API_BASE_URL` is used only by the owner sign-in and CMS interface. Set both to the API origin in hosted environments, for example `https://api.bchbenjamin.in`.

The local JSON snapshot also provides presentation-only fields such as custom project artwork and stack labels. New records created in the CMS are still rendered from the database; projects without a matching local artwork entry use the generic project visual until artwork is added.
