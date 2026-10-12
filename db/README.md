# Database setup — disconnected by default

No database calls or migrations were run to create this template. No production credentials, invitation manifests or guest rows are included. The SQL schema is unchanged.

Every runtime query and both database scripts call `lib/database.mjs`. This guard requires **both** `WEDDING_DATABASE_ENABLED=true` and `WEDDING_DATABASE_URL`. The original `DATABASE_URL` is ignored, even if it is inherited from a shell or hosting environment. `WEDDING_REPORT_PASSWORD` is a new, separate admin credential.

## Recommended setup for a future client

Create a new isolated Neon/PostgreSQL database owned by that client and a new deployment project. The retained driver supports Neon HTTP SQL; another provider requires a compatible adapter. Do not reuse any existing client's connection string.

```sh
cp .env.example .env.local
```

Fill `.env.local` with the **new** database URL and a unique strong `WEDDING_REPORT_PASSWORD`, then deliberately set `WEDDING_DATABASE_ENABLED=true`. Configure those same variables in the new deployment. Never use `NEXT_PUBLIC_` for secrets.

```sh
npm run db:setup
```

This executes the existing idempotent `CREATE TABLE IF NOT EXISTS` schema on the newly configured database. It does not seed guests, delete tables, or migrate an existing client's data. Do not run it until the new connection is verified.

## Guest management

Visit `/organizacion` and sign in. Add guest families, allocate seats, copy individual invitation links/messages, edit responses, revoke invitations, search/filter and download CSV as before. Set `site.url` in `config/wedding.json` before copying links.

Optional bulk import:

```sh
node --env-file=.env.local scripts/import-invitations.mjs private/source.json private/manifest.json private/links.html
```

Input is a JSON array of `{sourceKey, name, seats, sourceRow}`. Use new client data only; stable `sourceKey` values allow reimport. Keep the private manifest for subsequent imports. The importer refuses to rotate existing tokens if their matching manifest is missing. It creates the invitations schema if needed and updates matching guest names/seat allocations; it does not automatically delete omitted guests. Keep these files outside Git.

`invitations` stores SHA-256 token hashes and allocations. Short guest links are the first 96 bits of `token_hash`, so anyone who can read the database (or a backup) can rebuild every guest link; protect database access accordingly. `invitation_responses` stores one current response per invitation; `invitations.sent_at` records when the couple marked an invitation as sent. `report_login_failures` records failed organizer logins (hashed client address only) to block brute-force attempts: 5 failures from one address lock it out for 15 minutes. Databases created by older versions may still contain an unused `rsvp_responses` table; it is safe to drop. Server-side seat validation, token validation, active invitation checks and admin authorization remain intact. Possession of a guest link grants access to that invitation and its response; distribute each link only to its intended guest.

Full database integration testing is intentionally deferred until a separate test database is configured. Offline tests cover validation and the disconnected guard without contacting a database.
