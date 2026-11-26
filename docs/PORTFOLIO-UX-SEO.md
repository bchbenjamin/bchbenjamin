# Portfolio UX and search visibility
## References examined
- Vercel examples: solutions/blog/app/sitemap.ts and blog/[slug]/page.tsx — derive discoverable URLs and page metadata from content records.
  https://github.com/vercel/examples/tree/main/solutions/blog
- garmeeh/next-seo — use native App Router metadata and JSON-LD for structured content.
  https://github.com/garmeeh/next-seo
- Next.js loading and JSON-LD guides — streaming fallback and safe JSON serialization.
  https://nextjs.org/docs/app/api-reference/file-conventions/loading
  https://nextjs.org/docs/app/guides/json-ld
## Decisions
- No additional SEO dependency or artificial boot delay. Streaming fallback uses the existing owner logo. React request-scoped memoization avoids redundant content loading without persisting stale unpublished records.
- Welcome widget is a fixed orientation surface. Default gallery remains on page one; default search and clock move to page two. Explicit saved widget positions are retained.
- Normal HTML links and a text alternative make content accessible without requiring launcher gestures. The interactive links open the same portfolio apps when JavaScript is available.
- Canonical origin is the production www domain. Sitemap and schema derive from public content, not private admin records. Private routes are excluded from the sitemap. No fabricated keywords, timestamps, credentials, or person identifiers.
- Submit sitemap.xml in the verified Google Search Console property. Indexing is controlled by search engines; no automatic indexing guarantees.
