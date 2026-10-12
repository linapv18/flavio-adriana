import { weddingDatabaseUrl } from "../lib/database.mjs";
import { readFile } from 'node:fs/promises';
import { neon } from '@neondatabase/serverless';

const sql = neon(weddingDatabaseUrl());
const schema = await readFile(new URL('../db/invitations.sql', import.meta.url), 'utf8');
await sql.transaction(schema.split(';').map(s => s.trim()).filter(Boolean).map(s => sql.query(s)));
console.log('Esquema RSVP listo.');
