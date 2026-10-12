import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { hashToken, shortTokenFromHash, tokenLookup, invitationUrl } from '../lib/invitation-links.mjs';
import { loadTs } from './load-ts.mjs';
const { isInvitationToken } = await loadTs('invitation-token.ts');

test('short link resolves to the stored hash prefix', () => {
  for (let i = 0; i < 50; i++) {
    const hash = hashToken(randomBytes(32).toString('hex'));
    const short = shortTokenFromHash(hash);
    assert.ok(isInvitationToken(short));
    assert.deepEqual(tokenLookup(short), { short: true, lookup: hash.slice(0, 24) });
  }
});
test('long link resolves to the full hash', () => {
  const token = randomBytes(32).toString('hex');
  assert.ok(isInvitationToken(token));
  assert.deepEqual(tokenLookup(token), { short: false, lookup: hashToken(token) });
});
test('invitation URLs ignore a trailing slash on the site URL', () => {
  const hash = hashToken('x');
  assert.equal(invitationUrl('https://boda.example/', hash), invitationUrl('https://boda.example', hash));
  assert.match(invitationUrl('https://boda.example', hash), /^https:\/\/boda\.example\/\?token=[A-Za-z0-9_-]{16}$/);
});
