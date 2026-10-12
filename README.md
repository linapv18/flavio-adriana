# Wedding Starter Template

A separate, reusable Next.js wedding site. The original layout, responsive CSS, envelope animation, scroll motion, RSVP validation, guest invitation tokens, dashboard, and SQL schema are retained. Personal media, contacts, story, location recommendations, metadata, music, credentials, Git history, and deployment bindings are excluded.

## Start locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No database is needed to preview public pages. `/vista-sobre` previews the envelope using `Guest Name`. `/organizacion` explains that the database is disconnected. Live invitation lookup and RSVP submission require a new database; the template does not simulate saved responses.

## Edit for a new couple

Edit **`config/wedding.json`**. `config/weddingConfig.ts` exports it to components and derives the shared couple name and theme variables. This is public data: never add credentials or guest information.

- `couple`: names and optional text initials. The seal is a neutral ampersand; no personal monogram remains.
- `site`: new site's absolute URL (no trailing path), language, locale, timezone and SEO description. Set the correct production URL before generating invitation links. The importer and dashboard both use this URL.
- `date`: display labels plus `iso`, an ISO timestamp with timezone offset, e.g. `2030-06-15T17:00:00-05:00`. Empty `iso` intentionally shows dashes in the countdown. Update display labels and RSVP deadline to match.
- `theme`: original colors preserved as CSS custom properties. Main colors have descriptive names; `detail-*` entries control existing shadows, borders, envelope gradients and other decorative tones.
- `venues`, `story`, `dressCode`, `faqs`, `hotel`, `tourism`, `gifts`, `contact`, `quote`, `hero`: editable content, links, photos and recommendations. Repeat hotel detail blocks, tourism items/groups or FAQ groups as needed.
- `music`: disabled until `enabled` is true and `src` points to your own authorized audio file. Optional playlist link is supported.
- `invitation.message`: copied dashboard invitation message; keep `{firstName}`, `{url}`, and `{couple}` placeholders. `previewGuest` changes only the envelope design preview.
- `sections`: reorder the homepage by moving entries; set `enabled: false` to hide a section. Available IDs: hero, story, schedule, venues, quote, quickLinks, gifts, rsvp. Nav and footer frame the page.
- `pages`: disable story, travel or FAQs; navigation and related links are hidden and their routes return 404. `hotel.enabled` and `tourism.enabled` control travel sections independently.

Generic Spanish interface labels and form/validation messages remain in their components. This is a content template, not a complete translation system. Use the existing components to customize structure beyond the configuration.

## Replace assets

All photos are labeled SVG placeholders in `public/placeholders/`. Replace or update the configured paths for the hero, story preview, five collage images, ceremony, travel, hotel, tourism, RSVP background and social preview. Use PNG/JPEG for the social preview for broad social platform support. Replace `app/icon.svg` if desired. No original photos, favicon, monogram or music are included. Unused reception placeholder is available for future customization.

Local paths start with `/` and resolve from `public/`; keep images local unless you also configure Next.js remote image domains. Keep the five collage positions for the original composition (add positions in `StoryCollage.tsx` if adding photos). Set `music.src` only after adding the audio file.

## Create a new client project

1. Copy this folder to a new directory, excluding `node_modules`, `.next`, `.git`, `.env.local`, `private`, `outputs`, and `*.tsbuildinfo`. Never clone an existing client's configured environment or guest exports.
2. Run `npm ci` in the new directory; change the package name if desired.
3. Fill `config/wedding.json`, replace media, and preview desktop/mobile views with `npm run dev`.
4. Create a **new deployment project**, new repository if desired, and **new isolated database**. Do not attach to another client's Vercel project or database.
5. Follow `db/README.md` to opt into the new database, initialize the unchanged schema, and create invitations. Set a unique admin password.
6. Verify a test invitation, RSVP create/update, guest editing/revocation, dashboard counts and CSV on that new database before publishing.

## Production: Flavio & Adriana

- **Hosting:** Vercel project `flavio-adriana` (team "lmpere21asuedu's projects"), deployed from `main` on GitHub `linapv18/flavio-adriana`. Every push to `main` redeploys.
- **Database:** Neon project `flavio-adriana` (`ancient-hall-37332785`, AWS US East 1, branch `production`, database `neondb`). Tables were created from `db/invitations.sql` in the Neon SQL Editor; rerun that file there after schema changes (every statement is idempotent).
- **Environment variables (Vercel, Production):** `WEDDING_DATABASE_ENABLED=true`, `WEDDING_DATABASE_URL` (Neon pooled connection string, secret) and `WEDDING_REPORT_PASSWORD` (couple's panel password, secret). Optional `WEDDING_SITE_URL` for a custom domain; otherwise guest links use the Vercel production domain.
- **Couple's panel:** `/organizacion` on the production domain. It is not linked from the invitation; share it with the couple directly.

## Verification

```sh
npm run lint
npx tsc --noEmit
npm test
npm run build
```

## Retained implementation choices

This template retains the Neon serverless PostgreSQL driver as an **inactive dependency**, not a connected service. No connection URL or account binding is included. Activating a different PostgreSQL provider may require adapting the driver; do not assume the Neon HTTP driver works with ordinary local PostgreSQL. The schema needs no changes for another couple.

Spanish route paths, generic Spanish interface text, the five-photo collage, single-password admin login, family/invitation-based RSVP model (1–20 seats), shortened invitation tokens, and private/noindex headers are retained. No original client content or guest data remains. Dates have separate presentation fields by design; keep them consistent with the countdown timestamp.
