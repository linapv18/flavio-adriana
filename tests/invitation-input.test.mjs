import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';
const { parseInvitationInput } = await loadTs('invitation-input.ts');
const requestId = '3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e';
const guestNames = [' Ana Pérez ', 'Juan Pérez', 'Sofía Pérez', 'Mateo Pérez'];
const valid = { name: '  Familia Pérez ', seats: 4, requestId, guestNames };

test('acepta y limpia una invitación nueva con un nombre por cupo', () => {
  assert.deepEqual(parseInvitationInput(valid), { value: { id: undefined, name: 'Familia Pérez', seats: 4, requestId, guestNames: ['Ana Pérez', 'Juan Pérez', 'Sofía Pérez', 'Mateo Pérez'], response: undefined } });
});
test('rechaza nombres, cupos e identificadores inválidos', () => {
  for (const bad of [{ name: '' }, { name: '   ' }, { name: 'x'.repeat(201) }, { name: 7 }, { seats: 0 }, { seats: 21 }, { seats: 1.5 }, { seats: '4' }, { requestId: 'nope' }, { id: 'nope' }, { id: '' }]) {
    assert.ok('error' in parseInvitationInput({ ...valid, ...bad }), JSON.stringify(bad));
  }
  assert.ok('error' in parseInvitationInput(null));
});
test('exige un nombre por invitado', () => {
  for (const names of [undefined, ['Ana'], ['Ana', 'Juan', 'Sofía', ' '], ['Ana', 'Juan', 'Sofía', 'x'.repeat(121)], ['Ana', 'Juan', 'Sofía', 4]]) {
    assert.ok('error' in parseInvitationInput({ ...valid, guestNames: names }), JSON.stringify(names));
  }
  // Invitations saved before names existed can still be updated without them.
  assert.deepEqual(parseInvitationInput({ ...valid, guestNames: [] }).value.guestNames, []);
});
test('la respuesta es por persona y la cantidad se calcula', () => {
  const id = requestId;
  assert.deepEqual(parseInvitationInput({ ...valid, id, response: { attendance: [true, true, false, true] } }).value.response, { attending: true, partySize: 3, attendance: [true, true, false, true] });
  assert.deepEqual(parseInvitationInput({ ...valid, id, response: { attendance: [false, false, false, false] } }).value.response, { attending: false, partySize: 0, attendance: [false, false, false, false] });
  assert.equal(parseInvitationInput({ ...valid, id, response: null }).value.response, null);
  for (const response of [{ attendance: [true, true] }, { attendance: [true, true, null, true] }, { attending: true, partySize: 2 }, 'x']) {
    assert.ok('error' in parseInvitationInput({ ...valid, id, response }), JSON.stringify(response));
  }
});
