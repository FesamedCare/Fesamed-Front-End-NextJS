/**
 * Las doctoras aparecían como "Dr." en la lista y el detalle de citas.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { doctorTitle } from '../src/lib/doctorTitle.ts';

describe('doctorTitle', () => {
  test('doctora', () => assert.equal(doctorTitle('FEMENINO'), 'Dra. '));
  test('doctor', () => assert.equal(doctorTitle('MASCULINO'), 'Dr. '));
  test('otro o sin dato: solo el nombre, sin adivinar', () => {
    assert.equal(doctorTitle('OTRO'), '');
    assert.equal(doctorTitle(null), '');
    assert.equal(doctorTitle(undefined), '');
  });
});
