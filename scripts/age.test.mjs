/**
 * La edad en el borde del cumpleaños. Restar años sin mirar el día da un año
 * de más durante los meses previos.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { ageFrom } from '../src/lib/age.ts';

describe('ageFrom', () => {
  test('el día antes del cumpleaños todavía no suma', () => {
    assert.equal(ageFrom('1994-03-14', new Date(2026, 2, 13)), 31);
  });

  test('el día del cumpleaños suma', () => {
    assert.equal(ageFrom('1994-03-14', new Date(2026, 2, 14)), 32);
  });

  test('el día después sigue igual', () => {
    assert.equal(ageFrom('1994-03-14', new Date(2026, 2, 15)), 32);
  });

  test('un mes anterior no suma', () => {
    assert.equal(ageFrom('1994-12-31', new Date(2026, 0, 1)), 31);
  });

  test('sin fecha devuelve null', () => {
    assert.equal(ageFrom('', new Date(2026, 0, 1)), null);
  });

  test('una fecha inválida devuelve null', () => {
    assert.equal(ageFrom('no-es-fecha', new Date(2026, 0, 1)), null);
  });

  test('no se corre un día por la zona horaria', () => {
    // new Date("1994-03-14") es medianoche UTC: en Bogotá cae el 13.
    assert.equal(ageFrom('1994-03-14', new Date(2026, 2, 14)), 32);
  });
});
