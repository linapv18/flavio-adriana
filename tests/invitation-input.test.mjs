import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';
const { parseInvitationInput } = await loadTs('invitation-input.ts');
const requestId = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';
const valid = { name: '  Familia Pérez ', seats: 4, requestId };

test('acepta y limpia una invitación nueva', () => {
  assert.deepEqual(parseInvitationInput(valid), { value: { id: undefined, name: 'Familia Pérez', seats: 4, requestId, response: undefined } });
});
test('rechaza nombres, cupos e identificadores inválidos', () => {
  for (const bad of [{ name: '' }, { name: '   ' }, { name: 'x'.repeat(201) }, { name: 7 }, { seats: 0 }, { seats: 21 }, { seats: 1.5 }, { seats: '4' }, { requestId: 'nope' }, { id: 'nope' }, { id: '' }]) {
    assert.ok('error' in parseInvitationInput({ ...valid, ...bad }), JSON.stringify(bad));
  }
  assert.ok('error' in parseInvitationInput(null));
});
test('valida la respuesta contra los cupos', () => {
  const id = requestId;
  assert.ok('value' in parseInvitationInput({ ...valid, id, response: { attending: true, partySize: 4 } }));
  assert.ok('value' in parseInvitationInput({ ...valid, id, response: { attending: false, partySize: 0 } }));
  assert.equal(parseInvitationInput({ ...valid, id, response: null }).value.response, null);
  for (const response of [{ attending: true, partySize: 5 }, { attending: true, partySize: 0 }, { attending: false, partySize: 1 }, { attending: 'yes', partySize: 1 }, 'x']) {
    assert.ok('error' in parseInvitationInput({ ...valid, id, response }), JSON.stringify(response));
  }
});
