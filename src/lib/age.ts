/**
 * Edad cumplida a partir de una fecha "yyyy-MM-dd".
 *
 * Se construye la fecha por partes y no con `new Date(iso)`: esa forma
 * interpreta medianoche UTC y en Bogotá cae el día anterior, así que alguien
 * que cumple hoy aparecería con un año menos.
 */
export function ageFrom(
  birthDate: string,
  today: Date = new Date()
): number | null {
  if (!birthDate) return null;

  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;

  let edad = today.getFullYear() - y;
  // Restar años sin mirar el día da un año de más durante los meses previos
  // al cumpleaños.
  const yaCumplio =
    today.getMonth() + 1 > m ||
    (today.getMonth() + 1 === m && today.getDate() >= d);
  if (!yaCumplio) edad -= 1;

  return edad >= 0 ? edad : null;
}
