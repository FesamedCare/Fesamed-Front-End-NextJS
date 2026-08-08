/**
 * Cuentas del patrón semanal, del lado del cliente.
 *
 * Espejan `expand_pattern` y `leftover_minutes` del backend
 * (`doctor_schedule/generator.py`) para poder pintar el resumen mientras el
 * doctor arma el formulario, sin ir al servidor en cada tecla.
 *
 * El servidor sigue siendo la autoridad: la vista previa que se confirma sale
 * de su `dry_run`, que además conoce los turnos ya publicados y por tanto las
 * colisiones. Esto solo sirve para orientar mientras se escribe.
 */

/** 0 = lunes … 6 = domingo, igual que el backend y que `date.weekday()`. */
export const WEEKDAY_PRESETS = {
  weekdays: [0, 1, 2, 3, 4],
  monToSat: [0, 1, 2, 3, 4, 5],
  weekend: [5, 6],
} as const;

export type PresetName = keyof typeof WEEKDAY_PRESETS;

export interface PatternBlock {
  /** "HH:MM" */
  start: string;
  end: string;
}

function minutes(value: string): number {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

/** Duración útil de una franja, o 0 si está mal formada o invertida. */
function span(block: PatternBlock): number {
  const from = minutes(block.start);
  const to = minutes(block.end);
  if (Number.isNaN(from) || Number.isNaN(to)) return 0;
  return Math.max(0, to - from);
}

/**
 * Turnos que produce un día del patrón.
 *
 * El resto de cada franja se descarta: 8:00–12:00 con turnos de 45 min da 5
 * turnos, no 5,33. Un hueco de 15 minutos no es una consulta.
 */
export function countSlots(
  blocks: PatternBlock[],
  slotMinutes: number
): number {
  if (!slotMinutes || slotMinutes <= 0) return 0;
  return blocks.reduce(
    (total, block) => total + Math.floor(span(block) / slotMinutes),
    0
  );
}

/** Minutos que quedan sin publicar al final de las franjas, en un día. */
export function leftoverMinutes(
  blocks: PatternBlock[],
  slotMinutes: number
): number {
  if (!slotMinutes || slotMinutes <= 0) return 0;
  return blocks.reduce((total, block) => total + (span(block) % slotMinutes), 0);
}

/**
 * Si la selección de días equivale exactamente a un atajo.
 *
 * Compara conjuntos, no arreglos: el doctor puede haber llegado al mismo
 * grupo pulsando los días sueltos en cualquier orden, y el atajo debe
 * mostrarse activo igual.
 */
export function matchesPreset(weekdays: number[], preset: PresetName): boolean {
  const objetivo = WEEKDAY_PRESETS[preset];
  if (weekdays.length !== objetivo.length) return false;
  const elegidos = new Set(weekdays);
  return objetivo.every((d) => elegidos.has(d));
}
