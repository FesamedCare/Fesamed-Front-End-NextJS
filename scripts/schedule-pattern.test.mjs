/**
 * Cuentas del patrón en el cliente.
 *
 * Espejan `expand_pattern` del backend para poder pintar el resumen mientras
 * el doctor arma el formulario, sin ir al servidor en cada tecla. El servidor
 * sigue siendo la autoridad: la vista previa real sale de su `dry_run`.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  WEEKDAY_PRESETS,
  countSlots,
  leftoverMinutes,
  matchesPreset,
  weekdayFromISO,
} from '../src/lib/schedulePattern.ts';

describe('countSlots', () => {
  test('una franja exacta', () => {
    assert.equal(countSlots([{ start: '08:00', end: '12:00' }], 30), 8);
  });

  test('descarta el sobrante de la franja', () => {
    assert.equal(countSlots([{ start: '08:00', end: '12:00' }], 45), 5);
  });

  test('suma varias franjas', () => {
    assert.equal(
      countSlots(
        [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '17:00' }],
        30
      ),
      14
    );
  });

  test('una franja más corta que el turno no cuenta', () => {
    assert.equal(countSlots([{ start: '08:00', end: '08:20' }], 30), 0);
  });

  test('una franja invertida no cuenta', () => {
    assert.equal(countSlots([{ start: '12:00', end: '08:00' }], 30), 0);
  });

  test('sin duración no cuenta', () => {
    assert.equal(countSlots([{ start: '08:00', end: '12:00' }], 0), 0);
  });

  test('sin franjas da cero', () => {
    assert.equal(countSlots([], 30), 0);
  });
});

describe('leftoverMinutes', () => {
  test('reporta los minutos que se pierden', () => {
    assert.equal(leftoverMinutes([{ start: '08:00', end: '12:00' }], 45), 15);
  });

  test('sin sobrante da cero', () => {
    assert.equal(leftoverMinutes([{ start: '08:00', end: '12:00' }], 30), 0);
  });

  test('suma el sobrante de cada franja', () => {
    // 240 min sobran 15 · 210 min sobran 30
    assert.equal(
      leftoverMinutes(
        [{ start: '08:00', end: '12:00' }, { start: '14:00', end: '17:30' }],
        45
      ),
      45
    );
  });
});

describe('WEEKDAY_PRESETS', () => {
  test('lunes a viernes son 0..4', () => {
    assert.deepEqual(WEEKDAY_PRESETS.weekdays, [0, 1, 2, 3, 4]);
  });

  test('lunes a sábado son 0..5', () => {
    assert.deepEqual(WEEKDAY_PRESETS.monToSat, [0, 1, 2, 3, 4, 5]);
  });

  test('fin de semana son sábado y domingo', () => {
    assert.deepEqual(WEEKDAY_PRESETS.weekend, [5, 6]);
  });
});

describe('matchesPreset', () => {
  test('reconoce el atajo sin importar el orden', () => {
    assert.equal(matchesPreset([4, 0, 2, 1, 3], 'weekdays'), true);
  });

  test('no confunde un subconjunto', () => {
    assert.equal(matchesPreset([0, 1, 2], 'weekdays'), false);
  });

  test('no confunde días de más', () => {
    assert.equal(matchesPreset([0, 1, 2, 3, 4, 5], 'weekdays'), false);
  });
});


describe('weekdayFromISO', () => {
  test('lunes es 0, como en el backend', () => {
    // 2026-08-10 es lunes
    assert.equal(weekdayFromISO('2026-08-10'), 0);
  });

  test('domingo es 6, no 0', () => {
    assert.equal(weekdayFromISO('2026-08-16'), 6);
  });

  test('cubre la semana entera', () => {
    const dias = ['2026-08-10','2026-08-11','2026-08-12','2026-08-13',
                  '2026-08-14','2026-08-15','2026-08-16'];
    assert.deepEqual(dias.map(weekdayFromISO), [0, 1, 2, 3, 4, 5, 6]);
  });

  test('no se corre un dia por la zona horaria', () => {
    // new Date("2026-08-10") es medianoche UTC: en Bogota cae el domingo 9.
    // Si el calculo usara eso, esto daria 6 en vez de 0.
    assert.notEqual(weekdayFromISO('2026-08-10'), 6);
  });
});
