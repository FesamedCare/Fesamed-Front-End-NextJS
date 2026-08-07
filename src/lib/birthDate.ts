/**
 * Reglas de fecha de nacimiento en el cliente.
 *
 * Espejan las del backend en `src/app/api/v1/users/birth_date.py`. El servidor
 * es la autoridad: esto solo evita el viaje de ida y vuelta y le da al usuario
 * un mensaje inmediato en el formulario. Si cambian allá, cambian acá.
 *
 * Todo se calcula sobre las partes de la cadena `YYYY-MM-DD` en vez de con
 * `new Date(...)`, porque el constructor interpreta una fecha sin hora como
 * medianoche UTC y eso corre el resultado un día en husos negativos, que es el
 * caso de Colombia.
 */

export const EDAD_MINIMA_DOCTOR = 18;

/** Fecha local de hoy en `YYYY-MM-DD`, el formato de un `<input type="date">`. */
export function hoyISO(): string {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/** Indica si una fecha `YYYY-MM-DD` es posterior a hoy. Hoy no cuenta como futura. */
export function esFutura(iso: string): boolean {
  // Las fechas ISO ordenan lexicográficamente, así que alcanza con comparar
  // las cadenas y no hace falta construir objetos Date.
  return iso > hoyISO();
}

/** Años cumplidos a día de hoy. Resta uno si todavía no pasó el cumpleaños. */
export function aniosCumplidos(iso: string): number {
  const [nacimientoAnio, nacimientoMes, nacimientoDia] = iso.split("-").map(Number);
  const [hoyAnio, hoyMes, hoyDia] = hoyISO().split("-").map(Number);

  let anios = hoyAnio - nacimientoAnio;

  if (hoyMes < nacimientoMes || (hoyMes === nacimientoMes && hoyDia < nacimientoDia)) {
    anios -= 1;
  }

  return anios;
}
