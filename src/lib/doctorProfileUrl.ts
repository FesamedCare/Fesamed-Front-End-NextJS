/**
 * URL del perfil público de un doctor.
 *
 * El perfil vivía en `useState` dentro de `AgendarCitaContent`: no había
 * dirección que enlazar, el botón atrás sacaba del sitio y refrescar perdía el
 * perfil abierto.
 *
 * Se usa el parámetro de consulta y no un segmento (`/buscar-doctor/[id]`)
 * porque `/buscar-doctor` y `/agendar-cita` montan hoy el mismo componente, y
 * un segmento obligaría a duplicarlo o a resolver antes esa duplicación.
 */
export const DOCTOR_PARAM = "doctor";

export function doctorProfileUrl(doctorId: string): string {
  return `/buscar-doctor?${DOCTOR_PARAM}=${encodeURIComponent(doctorId)}`;
}
