/**
 * Un solo mecanismo para avisar que el perfil cambió.
 *
 * Antes había cuatro haciendo lo mismo: AuthContext.refreshUser, tres copias de
 * fetchUserData, el contador verificationRefresh con la prop refreshTrigger, y
 * el contador refresh con la prop onSaved. Cada componente nuevo tenía que
 * acordarse de cablear el correcto, y dos bugs salieron exactamente de ahí: el
 * porcentaje no subía al guardar el perfil, ni al verificar el teléfono.
 *
 * Ahora la fuente es AuthContext: `profileVersion` para suscribirse y
 * `notifyProfileChanged()` para avisar. Quien necesite cualquiera de los dos lo
 * toma del contexto, así que no hay nada que cablear y nada que olvidar.
 *
 * Este test falla si reaparece alguno de los mecanismos viejos.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RAIZ = new URL('../src', import.meta.url).pathname;

function archivosFuente(dir) {
  const salida = [];
  for (const entrada of readdirSync(dir)) {
    const ruta = join(dir, entrada);
    if (statSync(ruta).isDirectory()) salida.push(...archivosFuente(ruta));
    else if (/\.(ts|tsx)$/.test(entrada)) salida.push(ruta);
  }
  return salida;
}

/** Busca un patrón en todos los fuentes y devuelve archivo:línea de cada hallazgo. */
function buscar(patron, { excepto = [] } = {}) {
  const hallazgos = [];
  for (const ruta of archivosFuente(RAIZ)) {
    const corta = ruta.replace(RAIZ, 'src');
    if (excepto.some((e) => corta.includes(e))) continue;
    readFileSync(ruta, 'utf8')
      .split('\n')
      .forEach((linea, i) => {
        // Los comentarios explican por qué los mecanismos viejos ya no están:
        // mencionarlos ahí no cuenta como reintroducirlos.
        const sinComentario = linea.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, '');
        if (patron.test(sinComentario)) hallazgos.push(`${corta}:${i + 1}  ${linea.trim()}`);
      });
  }
  return hallazgos;
}

describe('un solo mecanismo de refresco de perfil', () => {
  test('nadie usa la prop refreshTrigger', () => {
    assert.deepEqual(buscar(/\brefreshTrigger\b/), []);
  });

  test('nadie usa las props onSaved ni onVerified', () => {
    assert.deepEqual(buscar(/\bonSaved\b|\bonVerified\b/), []);
  });

  test('no quedan contadores de refresco locales', () => {
    assert.deepEqual(buscar(/\bverificationRefresh\b|setRefresh\b/), []);
  });

  test('AuthContext expone profileVersion y notifyProfileChanged', () => {
    const ctx = readFileSync(join(RAIZ, 'contexts/AuthContext.tsx'), 'utf8');
    assert.match(ctx, /profileVersion/, 'falta profileVersion en AuthContext');
    assert.match(ctx, /notifyProfileChanged/, 'falta notifyProfileChanged en AuthContext');
  });

  test('las tarjetas de verificación consumen el contexto', () => {
    for (const archivo of ['ui/dashboard/VerificationStatusCard.tsx', 'ui/dashboard/VerificationActionsCard.tsx']) {
      const texto = readFileSync(join(RAIZ, 'app', archivo), 'utf8');
      assert.match(texto, /useAuthContext/, `${archivo} no consume el contexto`);
    }
  });
});
