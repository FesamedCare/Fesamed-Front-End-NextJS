/**
 * El panel no decía si la cuenta era de doctor o de paciente, y el teléfono
 * salía en formato interno ("tel:+57-304-3959321").
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { roleOf, formatPhone } from '../src/lib/roles.ts';

describe('roleOf', () => {
  test('objeto de la API', () => assert.equal(roleOf({ name: 'doctor' }), 'doctor'));
  test('texto', () => assert.equal(roleOf('patient'), 'patient'));
  test('desconocido o vacío', () => {
    assert.equal(roleOf({ name: 'root' }), null);
    assert.equal(roleOf(undefined), null);
    assert.equal(roleOf(null), null);
  });
});

describe('formatPhone', () => {
  test('quita el prefijo tel: y los guiones', () => assert.equal(formatPhone('tel:+57-304-3959321'), '+57 304 3959321'));
  test('un número ya legible queda igual', () => assert.equal(formatPhone('+57 304 3959321'), '+57 304 3959321'));
  test('vacío', () => assert.equal(formatPhone(undefined), ''));
});
