/**
 * Traducción de errores del backend a mensajes que se le pueden mostrar al usuario.
 *
 * Este módulo es puro a propósito: no toca `window`, `fetch` ni cookies, para que
 * se pueda probar con `npm test` sin navegador.
 */

/**
 * Se lanza cuando la sesión ya no es recuperable: el access token venció y el
 * refresh también falló.
 *
 * Es una clase y no un string porque `apiClient` necesita distinguir este caso
 * para redirigir al login. Antes se comparaba `error.message === 'Session expired'`,
 * lo que ataba la lógica de control al texto que ve el usuario: cambiar el mensaje
 * rompía el redirect, y cualquier otro 401 se mostraba con ese mismo texto.
 */
export class AuthExpiredError extends Error {
  constructor(message = 'Tu sesión expiró. Vuelve a iniciar sesión.') {
    super(message);
    this.name = 'AuthExpiredError';
  }
}

/** Un ítem del array `detail` que FastAPI devuelve en los 422 de validación. */
type ValidationItem = { msg?: string; loc?: unknown };

/**
 * Saca un mensaje legible del cuerpo de error de FastAPI.
 *
 * FastAPI usa `detail` de tres formas:
 *   - string, en los `HTTPException` que lanza la app  → "Email o contraseña no válidos"
 *   - array de `{ loc, msg }`, en los 422 de Pydantic  → se unen los `msg`
 *   - ausente, si la respuesta no es JSON              → se arma con el status
 */
export function parseErrorDetail(
  payload: unknown,
  status: number,
  statusText: string
): string {
  const detail = (payload as { detail?: unknown } | null | undefined)?.detail;

  if (Array.isArray(detail)) {
    const joined = (detail as ValidationItem[])
      .map((item) => item?.msg ?? String(item))
      .filter(Boolean)
      .join('. ');
    return joined || `Error ${status}`;
  }

  if (typeof detail === 'string' && detail.trim() !== '') {
    return detail;
  }

  if (detail !== undefined && detail !== null) {
    return JSON.stringify(detail);
  }

  return `Error ${status}: ${statusText}`;
}

/**
 * Endpoints donde un 401 es una respuesta legítima del negocio y no un token vencido.
 *
 *   - `/login`   401 significa "credenciales inválidas". Pedir un refresh es inútil
 *                y además tapaba el mensaje real del backend.
 *   - `/refresh` 401 significa "el refresh token no sirve". Reintentar es recursión.
 *
 * `/logout` NO va aquí: depende de `get_current_user`, así que ahí un 401 sí es
 * token vencido y renovar antes de reintentar es el comportamiento correcto.
 */
const PATHS_WITHOUT_REFRESH = ['/api/v1/login', '/api/v1/refresh'];

/**
 * Indica si vale la pena intentar renovar el token ante un 401 de este endpoint.
 */
export function shouldAttemptRefresh(endpoint: string): boolean {
  const path = endpoint.split('?')[0].replace(/\/+$/, '');
  return !PATHS_WITHOUT_REFRESH.some((known) => path === known || path.endsWith(known));
}
