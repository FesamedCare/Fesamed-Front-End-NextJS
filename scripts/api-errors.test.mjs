/**
 * Pruebas del manejo de errores del cliente API.
 *
 * Correr:  npm test
 *
 * Las pruebas de integración necesitan el backend arriba en NEXT_PUBLIC_API_URL
 * (por defecto http://localhost:8000). Si no responde, se saltan.
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

import {
  AuthExpiredError,
  parseErrorDetail,
  shouldAttemptRefresh,
} from '../src/lib/apiError.ts';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

describe('parseErrorDetail', () => {
  test('devuelve el detail cuando es string (401, 400, 404 de FastAPI)', () => {
    assert.equal(
      parseErrorDetail({ detail: 'Email o contraseña no válidos' }, 401, 'Unauthorized'),
      'Email o contraseña no válidos'
    );
  });

  test('une los msg cuando detail es un array de validación (422)', () => {
    const payload = {
      detail: [
        { loc: ['body', 'email'], msg: 'value is not a valid email address' },
        { loc: ['body', 'password'], msg: 'String should have at least 8 characters' },
      ],
    };
    assert.equal(
      parseErrorDetail(payload, 422, 'Unprocessable Entity'),
      'value is not a valid email address. String should have at least 8 characters'
    );
  });

  test('cae a un mensaje con el status cuando no hay cuerpo', () => {
    assert.equal(
      parseErrorDetail({}, 500, 'Internal Server Error'),
      'Error 500: Internal Server Error'
    );
  });

  test('serializa detail cuando es un objeto inesperado', () => {
    const msg = parseErrorDetail({ detail: { code: 'X' } }, 400, 'Bad Request');
    assert.equal(typeof msg, 'string');
    assert.match(msg, /X/);
  });
});

describe('shouldAttemptRefresh', () => {
  test('NO intenta refresh en /login: un 401 ahí son credenciales malas', () => {
    assert.equal(shouldAttemptRefresh('/api/v1/login'), false);
  });

  test('NO intenta refresh en /refresh: evita la recursión', () => {
    assert.equal(shouldAttemptRefresh('/api/v1/refresh'), false);
  });

  test('SÍ intenta refresh en endpoints normales', () => {
    assert.equal(shouldAttemptRefresh('/api/v1/user/me/'), true);
    assert.equal(shouldAttemptRefresh('/api/v1/appointment/'), true);
  });
});

describe('AuthExpiredError', () => {
  test('es identificable por tipo, no por el texto del mensaje', () => {
    const err = new AuthExpiredError();
    assert.ok(err instanceof AuthExpiredError);
    assert.ok(err instanceof Error);
    assert.equal(err.name, 'AuthExpiredError');
  });

  test('trae un mensaje en español, apto para mostrar al usuario', () => {
    assert.match(new AuthExpiredError().message, /sesión/i);
  });
});

describe('integración con el backend', () => {
  let up = false;

  before(async () => {
    try {
      const r = await fetch(`${API}/docs`, { signal: AbortSignal.timeout(4000) });
      up = r.ok;
    } catch {
      up = false;
    }
    if (!up) console.log(`  (saltadas: ${API} no responde)`);
  });

  test('un login con credenciales malas produce el mensaje del backend', async (t) => {
    if (!up) return t.skip('backend no disponible');

    const body = new URLSearchParams({
      username: 'noexiste@example.com',
      password: 'ClaveIncorrecta123',
    });
    const res = await fetch(`${API}/api/v1/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    assert.equal(res.status, 401);
    const payload = await res.json();
    const message = parseErrorDetail(payload, res.status, res.statusText);

    assert.equal(message, 'Email o contraseña no válidos');
    assert.notEqual(message, 'Session expired');
  });
});
