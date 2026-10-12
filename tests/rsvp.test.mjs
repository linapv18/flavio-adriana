import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTs } from './load-ts.mjs';
const { parseRsvp } = await loadTs('rsvp.ts');
const valid={attending:true,partySize:2,dietary:' Sin gluten ',message:''};
test('respeta cupos y limpia espacios',()=>{assert.equal(parseRsvp(valid,2).dietary,'Sin gluten');assert.equal(parseRsvp({...valid,partySize:1},1).partySize,1)});
test('rechaza exceso, fracciones, strings y ceros al asistir',()=>{for(const partySize of [0,-1,3,1.5,'2',null])assert.throws(()=>parseRsvp({...valid,partySize},2))});
test('no asistencia debe tener cero cupos y no guarda restricciones',()=>{assert.equal(parseRsvp({...valid,attending:false,partySize:0},2).dietary,'');assert.throws(()=>parseRsvp({...valid,attending:false},2))});
test('rechaza datos inválidos sin confiar en cupos del navegador',()=>{assert.throws(()=>parseRsvp(null,1));assert.throws(()=>parseRsvp({...valid,seats:10},1));assert.throws(()=>parseRsvp({...valid,attending:'yes'},2));assert.throws(()=>parseRsvp({...valid,message:'x'.repeat(2001)},2))});
