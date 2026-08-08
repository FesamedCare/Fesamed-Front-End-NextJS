/**
 * El perfil del doctor vivía en useState: no había URL que enlazar, el botón
 * atrás sacaba del sitio y refrescar perdía el perfil.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { DOCTOR_PARAM, doctorProfileUrl } from '../src/lib/doctorProfileUrl.ts';

describe('doctorProfileUrl', () => {
  test('apunta a la ruta pública con el doctor en el parámetro', () => {
    assert.equal(doctorProfileUrl('abc-123'), '/buscar-doctor?doctor=abc-123');
  });

  test('escapa el identificador', () => {
    assert.ok(doctorProfileUrl('a b&c').includes('a%20b%26c'));
  });

  test('el nombre del parámetro está en un solo sitio', () => {
    assert.equal(DOCTOR_PARAM, 'doctor');
    assert.ok(doctorProfileUrl('x').includes(`${DOCTOR_PARAM}=`));
  });
});
