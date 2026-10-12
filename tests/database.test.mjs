import test from 'node:test';
import assert from 'node:assert/strict';
import { databaseConfigured, weddingDatabaseUrl } from '../lib/database.mjs';
test('legacy environment cannot connect the template', () => {
  const env = { DATABASE_URL: 'postgresql://old:secret@original.invalid/database', REPORT_PASSWORD: 'legacy' };
  assert.equal(databaseConfigured(env), false);
  assert.throws(() => weddingDatabaseUrl(env), /disconnected/);
  assert.throws(() => weddingDatabaseUrl({ ...env, WEDDING_DATABASE_ENABLED: 'true' }), /disconnected/);
});
test('new URL alone or disabled flag cannot enable access', () => {
  const WEDDING_DATABASE_URL = 'postgresql://new:secret@new.invalid/database';
  for (const flag of [undefined, '', 'false', 'TRUE']) assert.throws(() => weddingDatabaseUrl({ WEDDING_DATABASE_URL, WEDDING_DATABASE_ENABLED: flag }), /disconnected/);
});
test('explicit new configuration is required, and invalid protocols rejected', () => {
  const env = { WEDDING_DATABASE_ENABLED: 'true', WEDDING_DATABASE_URL: 'postgresql://new:secret@new.invalid/database' };
  assert.equal(databaseConfigured(env), true);
  assert.equal(weddingDatabaseUrl(env), env.WEDDING_DATABASE_URL);
  assert.throws(() => weddingDatabaseUrl({ ...env, WEDDING_DATABASE_URL: 'https://example.com' }), /PostgreSQL/);
});
