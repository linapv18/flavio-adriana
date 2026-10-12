import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';
const { guestStatus, invitationMessage, summarize } = await loadTs('guest-rows.ts');
const row = (attending, partySize, seats = 3) => ({ id: String(Math.random()), invitationUrl: 'https://x/?token=a', name: 'Ana', seats, attending, partySize, dietary: null, message: null, updated: null, sent: false });

test('estado por respuesta', () => {
  assert.equal(guestStatus(row(null, null)), 'Sin respuesta');
  assert.equal(guestStatus(row(true, 2)), 'Asistirán');
  assert.equal(guestStatus(row(false, 0)), 'No asistirán');
});
test('mensaje usa el primer nombre y conserva "$" literal', () => {
  const text = invitationMessage('Hola {firstName}: {url} — {couple}', { name: '  $& Ana María ', invitationUrl: 'https://x/?token=$1' }, 'A & B');
  assert.equal(text, 'Hola $&: https://x/?token=$1 — A & B');
});
test('totales', () => {
  assert.deepEqual(summarize([row(true, 2), row(false, 0), row(null, null, 1)]), { confirmed: 2, attending: 1, declined: 1, pending: 1, seats: 7 });
});
