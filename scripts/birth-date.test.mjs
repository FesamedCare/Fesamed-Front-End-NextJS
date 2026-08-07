/**
 * Reglas de fecha de nacimiento en el cliente.
 *
 * Espejan las del backend en src/app/api/v1/users/birth_date.py. El servidor es
 * la autoridad; esto solo evita el viaje de ida y vuelta y da un mensaje
 * inmediato en el formulario.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  EDAD_MINIMA_DOCTOR,
  aniosCumplidos,
  esFutura,
  hoyISO,
} from '../src/lib/birthDate.ts';

function desplazarISO(anios, dias = 0) {
  const [a, m, d] = hoyISO().split('-').map(Number);
  const fecha = new Date(Date.UTC(a - anios, m - 1, d + dias));
  return fecha.toISOString().slice(0, 10);
}

describe('esFutura', () => {
  test('hoy no es futura', () => {
    assert.equal(esFutura(hoyISO()), false);
  });

  test('mañana sí', () => {
    assert.equal(esFutura(desplazarISO(0, 1)), true);
  });

  test('ayer no', () => {
    assert.equal(esFutura(desplazarISO(0, -1)), false);
  });

  test('una fecha muy futura sí', () => {
    assert.equal(esFutura('2075-08-11'), true);
  });

  test('una fecha vieja no', () => {
    assert.equal(esFutura('1990-05-20'), false);
  });
});

describe('aniosCumplidos', () => {
  test('el día del cumpleaños 18 ya cuenta 18', () => {
    assert.equal(aniosCumplidos(desplazarISO(18)), 18);
  });

  test('un día antes cuenta 17', () => {
    assert.equal(aniosCumplidos(desplazarISO(18, 1)), 17);
  });

  test('un día después sigue siendo 18', () => {
    assert.equal(aniosCumplidos(desplazarISO(18, -1)), 18);
  });

  test('el 29 de febrero no rompe', () => {
    // Nacido el 29/02/2000: la cuenta no debe lanzar ni devolver NaN.
    const edad = aniosCumplidos('2000-02-29');
    assert.ok(Number.isInteger(edad), `devolvió ${edad}`);
    assert.ok(edad >= 25, `edad inesperada: ${edad}`);
  });
});

describe('coherencia con el backend', () => {
  test('la edad mínima es la misma que en birth_date.py', () => {
    assert.equal(EDAD_MINIMA_DOCTOR, 18);
  });

  test('hoyISO tiene el formato que espera un input type=date', () => {
    assert.match(hoyISO(), /^\d{4}-\d{2}-\d{2}$/);
  });
});
