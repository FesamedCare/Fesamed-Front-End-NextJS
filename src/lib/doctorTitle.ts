/**
 * Tratamiento que antecede al nombre del especialista: "Dra." o "Dr.".
 *
 * Antes se escribía "Dr." para todos y las doctoras aparecían como "Dr. Laura
 * Restrepo". El género es opcional en el perfil; si no está, no se adivina por
 * el nombre: se muestra solo el nombre.
 */
export type GenderValue = "MASCULINO" | "FEMENINO" | "OTRO" | null | undefined;

export function doctorTitle(gender: GenderValue): string {
  if (gender === "FEMENINO") return "Dra. ";
  if (gender === "MASCULINO") return "Dr. ";
  return "";
}
