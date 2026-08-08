/**
 * Detección de idioma.
 *
 * La regla del producto es asimétrica y por eso conviene fijarla en tests: el
 * sitio es en español, y el inglés aparece sólo cuando el navegador NO pide
 * español. Un navegador en francés recibe inglés, no español, porque entre no
 * entender nada y entender algo, gana lo segundo.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { detectLocale, isLocale } from '../src/i18n/config.ts';

describe('detectLocale por Accept-Language', () => {
  test('español en cualquier variante manda español', () => {
    assert.equal(detectLocale('es-CO,es;q=0.9'), 'es');
    assert.equal(detectLocale('es-ES'), 'es');
    assert.equal(detectLocale('es'), 'es');
  });

  test('inglés manda inglés', () => {
    assert.equal(detectLocale('en-US,en;q=0.9'), 'en');
  });

  test('respeta el q-value, no el orden de aparición', () => {
    // El inglés viene primero en el string pero el español pesa más.
    assert.equal(detectLocale('en;q=0.3,es;q=0.9'), 'es');
    assert.equal(detectLocale('es;q=0.2,en;q=0.8'), 'en');
  });

  test('un idioma que no manejamos cae en inglés', () => {
    assert.equal(detectLocale('fr-FR,fr;q=0.9'), 'en');
    assert.equal(detectLocale('de'), 'en');
    assert.equal(detectLocale('pt-BR'), 'en');
  });

  test('ignora el comodín', () => {
    assert.equal(detectLocale('*'), 'en');
  });
});

describe('detectLocale por país cuando no hay Accept-Language', () => {
  test('país hispanohablante manda español', () => {
    assert.equal(detectLocale(null, 'CO'), 'es');
    assert.equal(detectLocale(null, 'mx'), 'es');
  });

  test('cualquier otro país manda inglés', () => {
    assert.equal(detectLocale(null, 'US'), 'en');
    assert.equal(detectLocale(null, 'FR'), 'en');
  });

  test('sin ninguna señal, español', () => {
    assert.equal(detectLocale(null), 'es');
    assert.equal(detectLocale(undefined, null), 'es');
  });
});

describe('el Accept-Language gana sobre el país', () => {
  test('navegador en inglés desde Colombia recibe inglés', () => {
    assert.equal(detectLocale('en-US,en;q=0.9', 'CO'), 'en');
  });

  test('navegador en español desde Estados Unidos recibe español', () => {
    assert.equal(detectLocale('es-MX,es;q=0.9', 'US'), 'es');
  });
});

describe('isLocale', () => {
  test('acepta sólo los dos idiomas del sitio', () => {
    assert.equal(isLocale('es'), true);
    assert.equal(isLocale('en'), true);
    assert.equal(isLocale('fr'), false);
    assert.equal(isLocale(undefined), false);
    assert.equal(isLocale(null), false);
  });
});
