# Portfolio design system

## Product intent

A personal engineering portfolio that presents verified work, education, experience and technical interests. Content is owned and edited through the private backend workspace. The public website is a deliberately curated projection of that data, not a dump of every stored field.

## Non-negotiable visual theme

- **AMOLED dark mode only.** The document canvas, page background and full-bleed sections use pure black (`#000000`). Do not introduce a light theme, cream canvas, white page, or automatic light-mode switch.
- Secondary surfaces may use near-black charcoal (`#090909`, `#111111`) to separate cards and controls. Borders stay subtle (`#1a1a1a` to `#303038`).
- Primary text is soft white (`#f5f5f5`); secondary text uses accessible cool greys. Accent colours are restrained periwinkle/blue with occasional coral or positive-state green.
- The document emits an early `<meta name="color-scheme" content="dark">`, declares `color-scheme: dark` on `:root`, and uses black `themeColor`. Form controls, dialogs, admin surfaces and hover states must remain dark.
- **Liquid glass must be real, not a blur-only imitation.** The primary navigation uses a licensed SVG displacement-map implementation to refract live backdrop pixels in Chromium. Unsupported engines receive a deliberate frosted fallback; do not label a plain translucent gradient as refractive glass. Keep refractive hosts compact, keep their wrappers transparent, and avoid backdrop-root triggers on their ancestors.
- Keep contrast readable; do not rely on colour alone to communicate status.

## Homepage hierarchy

The first content section after navigation is a **horizontal project image gallery**, inspired by the visual browsing pattern on Atria Institute's site. It is a real project index, not a rotating promotional headline:

1. Horizontal image rail backed by owner-uploaded project photos/screenshots, with a designed project-preview fallback when a project has no public image. Each item has its title, category and concise summary.
2. Hero introduction and primary navigation actions.
3. Principles strip.
4. Achievement gallery.
5. Selected project cards.
6. About, skills and contact sections.

The first gallery supports touch swiping, trackpad/mouse horizontal scrolling, scroll snapping and explicit previous/next controls. It must never trap keyboard focus. Project cards link to their corresponding detail pages. The owner can hide/reorder the gallery through Site Builder. The gallery is a manually browsable strip; do not autoplay it.

## Motion and interaction language

Motion should communicate affordance, feedback and spatial continuity. Keep it light, quick and interruptible. Prefer transform and opacity; avoid large layout reflows, blur-filter reveals and expensive continuous effects. Pointer motion must be frame-coalesced and respect reduced-motion preferences.

### Navigation and controls
- Buttons and navigation items use restrained spring-like press/hover responses: slight lift on hover, compression on press, short colour/border transitions. Use a `linear()` overshoot curve with a cubic-bezier fallback where supported.
- Arrows, switches and active gallery markers move with a spring-like easing rather than abrupt state changes.
- Links have a clear hover/focus treatment and retain keyboard-visible focus outlines. A persistent, keyboard-operable global motion control pauses persistent decorative CSS and GSAP motion, the animated divider and gallery autoplay; functional upload/loading indicators remain active while interaction feedback stays responsive.

### Hero blueprint
- The abstract systems blueprint responds subtly to pointer movement with perspective tilt.
- Routes carry a travelling signal; nodes breathe at staggered intervals; floating cards drift slightly; the central mark has a low-amplitude float/glow.
- The blueprint remains decorative and never blocks text or pointer interaction.

### Project previews
- Preview artwork reacts to hover: radar sweep, classifier signal lines, mini-chart bars and timeline playhead animate to reveal the kind of system represented.
- Cards lift slightly and reveal navigation affordances. Keep all card content accessible without hover, especially on touch screens.
- Save/bookmark controls persist the user's saved slugs locally and show a clear saved state and aggregate count.

### Achievement gallery
- The selected achievement changes with a smooth transition and a spring-like active marker.
- Autoplay, where enabled, pauses on hover and keyboard focus. Previous/next controls remain available. Avoid rapid rotation.
- Uploaded gallery media is private until explicitly marked public and attached to a public record.

### Contact and footer
- Copy-email uses a layered-card gesture and reports copied/error state.
- Contact submit communicates idle, loading, success and failure states with a short icon/spinner transition. Never fake successful submission.

### Owner workspace
- Section-visibility switches, field-visibility controls, media upload/drop zones and publication controls animate only on actual state changes.
- Upload progress reflects bytes transferred, not a timer. Private/public visibility must be explicit.
- Admin-only controls remain operable with keyboard and assistive technology; animation must not imply a save or publish action before the server confirms it.

## Content ownership and visibility

- The backend database is the canonical editable store for profile, projects, experience, education, skills, achievements, custom fields, media and homepage configuration.
- The owner workspace supports record CRUD and custom metadata. Public field allowlists decide which properties can be returned from public APIs. Unchecked fields remain private.
- Record publication, per-field public visibility, homepage section visibility and résumé inclusion are separate controls. Hiding a project from the website must not silently delete it or alter a résumé selection.
- `resumeIncluded` determines whether verified data is available to the private résumé generator. It is not a public field and must never be returned by public APIs.
- The résumé generator must use only records explicitly included in the résumé dataset. Job-description tailoring ranks/selects existing record IDs; it must not invent employers, skills, dates, metrics or prose.
- Content must be sourced from the owner's current résumé. Confidential employers and engagements must not be seeded, displayed or included in résumé-generation data.
- When live API mode is enabled, it is authoritative. If the profile/API is unavailable, fail closed rather than reviving stale local content. The bundled JSON snapshot is a deployment fallback only when no API base is configured.

## Accessibility and performance

- Respect `prefers-reduced-motion`: continuous decorative motion defaults to a static state and is only opted into when motion is allowed; disable orbit, breathing, floating and pointer-tilt motion while preserving non-spatial colour/focus feedback.
- Horizontal gallery: meaningful accessible label, native overflow scrolling, scroll snapping, labelled arrow buttons, visible focus styles and no autoplay.
- Do not make information available only on hover. Use real buttons for actions and links for navigation.
- Lazy-load non-critical media, keep the first viewport lightweight, and avoid unnecessary animation libraries on static content.
- On mobile, remove pointer tilt and prioritise swipe gestures, large tap targets and readable card widths.
- Test dark backgrounds and controls on both OLED and standard displays, plus keyboard navigation and reduced-motion preferences.

## Design implementation map

- `src/app/theme.css`: shared design tokens.
- `src/app/amoled.css`: mandatory AMOLED overrides.
- `src/app/editorial.css`: layout, responsive behaviour and interaction/motion styles.
- `src/components/HomeImageGallery.tsx`: first-fold horizontal gallery.
- `src/lib/liquid-glass/`: licensed refraction implementation, MIT license and browser fallback notes.
- `src/components/ScrollExperience.tsx`, `AchievementGallery.tsx`, `ProjectVisual.tsx`, `SaveProjectButton.tsx`, `CopyEmailButton.tsx`, `ContactForm.tsx`, `MediaLibrary.tsx`, and `SiteBuilder.tsx`: motion-bearing interaction components.
- `src/lib/content.ts` and `backend/`: public content projections, editing and persistence rules.
