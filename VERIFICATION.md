# Template verification

- Original project: 84 source/content/environment file hashes compared before and after; no changes. Git, active build caches and dependency trees excluded from the hash comparison and never edited in the original.
- Client-content scan: no original names, location, booking code, personal contacts, music attribution or production domain remain in template source, configuration or documentation.
- Schema: copied unchanged. No migrations, imports, database reads or database writes executed.
- ESLint and TypeScript: passed.
- Production build: passed. The existing Google Font requires network access at build time.
- Offline tests (`npm test`): 16 passed, including RSVP and organizer input validation, guest-link derivation, report totals and the fail-closed connection guard with legacy environment variables.
- Scripts: JavaScript syntax checks passed; both use the guarded connection helper.
- Assets: all 13 configured placeholder image paths exist.
- Browser preview: desktop and 390px mobile homepage checked; no horizontal overflow or broken loaded images on mobile. Mobile menu, placeholder travel page and envelope opening checked.
- Live database integration remains untested intentionally. Use a new isolated test database before testing invitation creation, persistence, edits, revocation and CSV with real records.
