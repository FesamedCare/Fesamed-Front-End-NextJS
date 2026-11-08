/**
 * Funciones que existen en la interfaz pero aún no en el backend.
 *
 * Ingresar o registrarse con Google y Facebook: los botones llevaban a
 * /auth/google y /auth/facebook, rutas que la API no tiene (404). Quedan ocultos
 * hasta que el backend lo implemente; para mostrarlos, NEXT_PUBLIC_SOCIAL_LOGIN=true.
 */
export const SOCIAL_LOGIN_ENABLED = process.env.NEXT_PUBLIC_SOCIAL_LOGIN === "true";
