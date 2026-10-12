# Content audit and editing map

All entries below previously embedded client content directly in the indicated source files. They now read the central configuration or use neutral assets.

| Original location | Content extracted or removed | New source |
| --- | --- | --- |
| `components/HeroCarousel.tsx` | Initials and hero photos | `couple`, `hero` |
| `components/NavBar.tsx`, `Footer.tsx` | Names, initials, footer date/location | `couple`, `date`, `navigation`, `pages` |
| `components/InvitationCover.tsx`, `app/vista-sobre/page.tsx` | Couple names, date, personal seal and named demo guest | `couple`, `date.label`, `invitation.previewGuest`; neutral ampersand seal |
| `components/StoryCollage.tsx`, `app/nuestra-historia/page.tsx` | Personal story, names and five photographs | `story` |
| `components/Schedule.tsx`, `Countdown.tsx` | Ceremony date/time and local timezone reference | `date` |
| `components/VenueDetails.tsx` | Church, reception venue, addresses, maps, venue photograph | `venues` |
| `app/viaje-alojamiento/page.tsx`, `components/ReserveButton.tsx` | Hotel, booking code, rates, benefits, hours, named contacts, emails, phone, website, address and photos | `hotel`, `assets.travel` |
| Former `components/ExploreBarranquilla.tsx` | City, restaurants, attractions, Instagram links and city image | Replaced by `ExploreDestination.tsx`, using `tourism` |
| `app/faqs/page.tsx` | Black-tie requirements, reserved attire colors, moodboards, adults-only policy, food promises | `dressCode`, `faqs` |
| `components/Gifts.tsx`, `Quote.tsx` | Gift preference, personal quote/attribution | `gifts`, `quote` |
| `components/QuickLinks.tsx`, `app/rsvp/page.tsx`, invitation not-found page | Personal WhatsApp number/contact URL | `contact` |
| `components/RSVPBanner.tsx` | RSVP deadline and personal background image | `date.rsvpDeadline`, `assets.rsvp` |
| `components/WeddingMusic.tsx` | Song file, artist/title | `music`; audio removed and disabled by default |
| `app/layout.tsx` | Domain, social image, metadata names/date/location | `site`, `couple`, `assets.social` |
| `app/rsvp/page.tsx`, `app/organizacion/page.tsx` | Page titles, couple name, date | `couple`, `date` |
| `app/organizacion/page.tsx`, `scripts/import-invitations.mjs` | Hardcoded production domain in guest links and export heading | `site.url`, `couple` |
| `components/GuestReport.tsx` | Couple signature in copied messages, locale/timezone | `invitation.message`, `couple`, `site` |
| Global/envelope CSS | Fixed design colors | `theme`, applied as root CSS variables |
| `public/`, app icons | Original photos, music, monogram and favicon | Labeled placeholders and neutral icon |
| Environment, database README, package metadata, Git/deployment state | Client credentials, project identity, historical guest-import counts and deployment associations | Excluded or rewritten; blank `.env.example`, neutral package name |

`sections` controls the order and visibility of homepage components. `pages` controls optional routes and their links. Generic interface labels, error messages and animation/layout code remain in components. No original personal content remains, but this is still the same application architecture: Spanish routes, single-password organizer access, PostgreSQL schema, Neon-compatible driver, guest-family RSVP and five-position photo collage.

## Moderna — Capítulos (current design)

The home page, envelope and organizer panel now follow the "Moderna — Capítulos" design: ink and ivory, Instrument Serif with Jost, a gatefold envelope, scrolling chapters and a dark organizer workspace. Several components listed above (HeroCarousel, InvitationCover, StoryCollage, Schedule, Countdown, VenueDetails, GuestReport) were replaced and removed; the table above is kept as the original audit.

| Where | Reads from config |
| --- | --- |
| `components/moderna/ModernaInvitation.tsx` (envelope, chapters, RSVP sheet) | `couple`, `date`, `venues`, `story`, `hotel`, `tourism`, `dressCode`, `faqs`, `gifts`, `contact`, `pages`, `photos` |
| `components/moderna/ModernaOrganizer.tsx` (panel) | `couple`, `date`, `site`, `invitation.message` |
| `lib/moderna.ts` (dates, chapters, seat labels) | `date.iso`, `site.locale`, `site.timeZone`, `couple.initials`, `pages` |

`photos.monochrome` turns the black-and-white treatment on or off; `photos.chapters` sets the desktop side photo for each chapter. `/programa`, `/faqs`, `/nuestra-historia`, `/viaje-alojamiento`, `/detalles` and `/rsvp` redirect to their chapter. The Viaje chapter (lodging from `hotel`, city guide from `tourism`) appears when `pages.travel` is on and either section is enabled. Gifts appear as a question in Preguntas. The invitation does not link to `/organizacion`; share that address with the couple directly. Story photos open full screen.
