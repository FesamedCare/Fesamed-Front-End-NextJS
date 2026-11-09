/**
 * Enlaces a la búsqueda de doctores filtrada por especialidad.
 *
 * Los accesos del inicio ("Cirugías plásticas", "Implantes dentales"...) y de
 * "Nosotros" apuntaban a `/services/serviceN`, rutas que no existen: el
 * visitante terminaba en el login. Ahora llevan a `/buscar-doctor` con la
 * especialidad en la URL y la búsqueda la aplica al cargar.
 *
 * Se pasa el nombre y no el id porque los ids cambian entre bases de datos
 * (local, staging, producción); el nombre es el mismo en el catálogo de todas.
 */
export const SPECIALTY_PARAM = "especialidad";

export function specialtySearchUrl(specialtyName: string): string {
  return `/buscar-doctor?${SPECIALTY_PARAM}=${encodeURIComponent(specialtyName)}`;
}

/** Compara sin tildes, mayúsculas ni espacios de más. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function findSpecialtyByName<T extends { name: string }>(
  specialties: T[],
  name: string,
): T | undefined {
  const target = normalize(name);
  return specialties.find((s) => normalize(s.name) === target);
}
