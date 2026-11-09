/**
 * Los accesos por especialidad del inicio apuntaban a /services/serviceN, que
 * no existe, y mandaban al visitante al login.
 */
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  SPECIALTY_PARAM,
  specialtySearchUrl,
  findSpecialtyByName,
} from '../src/lib/specialtySearchUrl.ts';

describe('specialtySearchUrl', () => {
  test('lleva a la búsqueda pública con la especialidad en la URL', () => {
    assert.equal(specialtySearchUrl('Odontólogo'), '/buscar-doctor?especialidad=Odont%C3%B3logo');
  });

  test('el nombre del parámetro está en un solo sitio', () => {
    assert.equal(SPECIALTY_PARAM, 'especialidad');
  });
});

describe('findSpecialtyByName', () => {
  const catalog = [
    { id: '1', name: 'Cirujano plástico' },
    { id: '2', name: 'Odontólogo' },
    { id: '3', name: 'Médico general' },
  ];

  test('encuentra la especialidad exacta', () => {
    assert.equal(findSpecialtyByName(catalog, 'Cirujano plástico')?.id, '1');
  });

  test('ignora tildes, mayúsculas y espacios', () => {
    assert.equal(findSpecialtyByName(catalog, '  odontologo ')?.id, '2');
    assert.equal(findSpecialtyByName(catalog, 'MEDICO GENERAL')?.id, '3');
  });

  test('devuelve undefined si no existe', () => {
    assert.equal(findSpecialtyByName(catalog, 'Astrólogo'), undefined);
  });
});
