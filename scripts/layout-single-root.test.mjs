/**
 * La app tiene que renderizar bajo un único elemento raíz dentro de <body>.
 *
 * No es cosmético. Headless UI v2 decide qué clic es "afuera" en
 * `use-root-containers.js`: recorre los hijos directos de html y body, y a cada
 * uno que NO contiene su "main tree node" lo marca como contenedor interno.
 * `useOutsideClick` no cierra si el clic cae dentro de un contenedor.
 *
 * Con la navbar y el contenido como hermanos de primer nivel, el subárbol del
 * contenido queda marcado como interno y ningún clic en la página cierra los
 * dropdowns. Se manifestó en el menú de usuario de la navbar: cerraba al hacer
 * clic sobre la propia navbar, pero no sobre el cuerpo de la página.
 *
 * Los <script> que inyecta Next también quedan como hijos de body y también se
 * marcan como contenedores, pero eso es inofensivo: nadie puede hacerles clic.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const FRONT = process.env.FRONT_URL ?? 'http://localhost:3000';

/** Etiquetas de los hijos directos de <body>, ignorando scripts. */
function hijosDeBody(html) {
  const cuerpo = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  if (!cuerpo) return null;

  const VACIOS = new Set(['br', 'img', 'input', 'meta', 'link', 'hr', 'source']);
  const hijos = [];
  let profundidad = 0;

  for (const m of cuerpo[1].matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    const [, cierre, tag, , autocerrado] = m;
    if (VACIOS.has(tag.toLowerCase())) continue;
    if (cierre) {
      profundidad -= 1;
      continue;
    }
    if (profundidad === 0) hijos.push(tag.toLowerCase());
    if (!autocerrado) profundidad += 1;
  }

  return hijos.filter((t) => t !== 'script' && t !== 'template');
}

describe('un solo elemento raíz bajo <body>', () => {
  let html = null;

  before(async () => {
    try {
      const res = await fetch(FRONT, { signal: AbortSignal.timeout(30000) });
      if (res.ok) html = await res.text();
    } catch {
      html = null;
    }
    if (!html) console.log(`  (saltadas: ${FRONT} no responde)`);
  });

  test('la navbar y el contenido no son hermanos de primer nivel', (t) => {
    if (!html) return t.skip('front no disponible');

    const hijos = hijosDeBody(html);
    assert.notEqual(hijos, null, 'no se pudo parsear <body>');
    assert.deepEqual(
      hijos,
      ['div'],
      `<body> debe tener un único hijo elemento (sin contar scripts), y tiene: ${hijos.join(', ')}.\n` +
        'Con más de uno, Headless UI trata los subárboles hermanos como "dentro" y los dropdowns no cierran al hacer clic afuera.'
    );
  });
});
