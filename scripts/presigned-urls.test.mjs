/**
 * Guarda contra cache-busters sobre URLs prefirmadas de S3.
 *
 * Las fotos vienen del backend ya firmadas. La firma SigV4 cubre el query
 * string completo, así que agregarle cualquier parámetro (con ? o con &) la
 * invalida y el navegador recibe 403 SignatureDoesNotMatch.
 *
 * Esta prueba existe porque el bug apareció en CUATRO lugares y una búsqueda
 * con un patrón demasiado estrecho solo encontró dos. Un escaneo del árbol es
 * más confiable que acordarse de revisar cada sitio nuevo.
 *
 * No hace falta cache-buster: cada subida genera una clave con UUID nuevo.
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
    if (statSync(ruta).isDirectory()) {
      salida.push(...archivosFuente(ruta));
    } else if (/\.(ts|tsx)$/.test(entrada)) {
      salida.push(ruta);
    }
  }
  return salida;
}

// Captura `${algo.profile_picture}?t=...`, `${data.profile_picture_url}&v=...`
// y cualquier variante sobre un campo cuyo nombre contenga profile_picture.
const CACHE_BUSTER = /\$\{[^}]*profile_picture[a-z_]*\}\s*[?&][a-z_]+=/i;

describe('URLs prefirmadas', () => {
  const archivos = archivosFuente(RAIZ);

  test('hay archivos que revisar', () => {
    assert.ok(archivos.length > 50, `solo se encontraron ${archivos.length} archivos`);
  });

  test('ningún archivo le agrega parámetros a una URL de foto', () => {
    const culpables = [];

    for (const ruta of archivos) {
      const lineas = readFileSync(ruta, 'utf8').split('\n');
      lineas.forEach((linea, i) => {
        if (CACHE_BUSTER.test(linea)) {
          culpables.push(`${ruta.replace(RAIZ, 'src')}:${i + 1}  ${linea.trim()}`);
        }
      });
    }

    assert.deepEqual(
      culpables,
      [],
      `Rompen la firma SigV4 y producen 403:\n  ${culpables.join('\n  ')}`
    );
  });
});
