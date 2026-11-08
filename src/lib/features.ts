/**
 * Accesos con cuentas de terceros.
 *
 * Google: activo por defecto; la API lo implementa en /auth/google. Para
 * apagarlo, NEXT_PUBLIC_GOOGLE_LOGIN=false.
 *
 * Facebook: oculto. Los botones llevaban a /auth/facebook, que la API no tiene
 * (404). Para mostrarlo cuando exista, NEXT_PUBLIC_FACEBOOK_LOGIN=true.
 */
export const GOOGLE_LOGIN_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_LOGIN !== "false";
export const FACEBOOK_LOGIN_ENABLED = process.env.NEXT_PUBLIC_FACEBOOK_LOGIN === "true";

/**
 * URL que inicia el login con Google. `next` es la ruta del frontend a la que
 * volver; la API descarta cualquier cosa que no sea una ruta interna.
 */
export function googleLoginUrl(next = "/dashboard"): string {
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}/auth/google?next=${encodeURIComponent(next)}`;
}
