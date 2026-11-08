import {
  Activity,
  Apple,
  Baby,
  Bone,
  Brain,
  BrainCircuit,
  Building2,
  Castle,
  Coffee,
  Droplet,
  Dumbbell,
  Ear,
  Eye,
  Flower2,
  HeartPulse,
  Landmark,
  Mountain,
  MountainSnow,
  Scissors,
  Smile,
  Sparkles,
  Stethoscope,
  Sun,
  TreePalm,
  Waves,
  type LucideIcon,
} from "lucide-react";

/**
 * Íconos y colores de la barra de búsqueda.
 *
 * Las clases de Tailwind van completas (no armadas con plantillas) para que el
 * compilador de Tailwind las encuentre al generar el CSS.
 */
export interface CatalogVisual {
  icon: LucideIcon;
  tile: string;
}

/** Normaliza para comparar con el catálogo sin tildes ni mayúsculas. */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

/** Ciudades destacadas, en el orden en que se muestran. */
export const FEATURED_CITIES: { name: string; visual: CatalogVisual }[] = [
  { name: "Bogotá, D.C.", visual: { icon: Landmark, tile: "bg-rose-50 text-rose-500" } },
  { name: "Medellín", visual: { icon: Mountain, tile: "bg-orange-50 text-orange-500" } },
  { name: "Cali", visual: { icon: TreePalm, tile: "bg-amber-50 text-amber-500" } },
  { name: "Barranquilla", visual: { icon: Sun, tile: "bg-yellow-50 text-yellow-600" } },
  { name: "Cartagena", visual: { icon: Castle, tile: "bg-emerald-50 text-emerald-600" } },
  { name: "Santa Marta", visual: { icon: Waves, tile: "bg-cyan-50 text-cyan-600" } },
  { name: "Bucaramanga", visual: { icon: Building2, tile: "bg-violet-50 text-violet-500" } },
  { name: "Pereira", visual: { icon: Coffee, tile: "bg-lime-50 text-lime-600" } },
  { name: "Manizales", visual: { icon: MountainSnow, tile: "bg-sky-50 text-sky-500" } },
];

/** Especialidades destacadas, en el orden en que se muestran. */
export const FEATURED_SPECIALTIES: { name: string; visual: CatalogVisual }[] = [
  { name: "Médico general", visual: { icon: Stethoscope, tile: "bg-blue-50 text-blue-600" } },
  { name: "Odontólogo", visual: { icon: Smile, tile: "bg-sky-50 text-sky-500" } },
  { name: "Pediatra", visual: { icon: Baby, tile: "bg-amber-50 text-amber-500" } },
  { name: "Ginecólogo", visual: { icon: Flower2, tile: "bg-pink-50 text-pink-500" } },
  { name: "Cardiólogo", visual: { icon: HeartPulse, tile: "bg-rose-50 text-rose-500" } },
  { name: "Dermatólogo", visual: { icon: Sparkles, tile: "bg-violet-50 text-violet-500" } },
  { name: "Psicólogo", visual: { icon: Brain, tile: "bg-indigo-50 text-indigo-500" } },
  { name: "Psiquiatra", visual: { icon: BrainCircuit, tile: "bg-purple-50 text-purple-500" } },
  { name: "Oftalmólogo", visual: { icon: Eye, tile: "bg-cyan-50 text-cyan-600" } },
  { name: "Ortopedista y Traumatólogo", visual: { icon: Bone, tile: "bg-stone-100 text-stone-500" } },
  { name: "Cirujano plástico", visual: { icon: Scissors, tile: "bg-fuchsia-50 text-fuchsia-500" } },
  { name: "Nutricionista", visual: { icon: Apple, tile: "bg-lime-50 text-lime-600" } },
];

/** Para especialidades fuera de la lista destacada. */
const EXTRA_SPECIALTY_VISUALS: Record<string, CatalogVisual> = {
  [normalizeName("Neurólogo")]: { icon: Activity, tile: "bg-indigo-50 text-indigo-500" },
  [normalizeName("Endocrinólogo")]: { icon: Droplet, tile: "bg-teal-50 text-teal-600" },
  [normalizeName("Otorrinolaringólogo")]: { icon: Ear, tile: "bg-orange-50 text-orange-500" },
  [normalizeName("Fisioterapeuta")]: { icon: Dumbbell, tile: "bg-emerald-50 text-emerald-600" },
};

const DEFAULT_SPECIALTY: CatalogVisual = { icon: Stethoscope, tile: "bg-gray-100 text-gray-500" };

export function specialtyVisual(name: string): CatalogVisual {
  const key = normalizeName(name);
  return (
    FEATURED_SPECIALTIES.find((s) => normalizeName(s.name) === key)?.visual ??
    EXTRA_SPECIALTY_VISUALS[key] ??
    DEFAULT_SPECIALTY
  );
}

export function cityVisual(name: string): CatalogVisual | undefined {
  const key = normalizeName(name);
  return FEATURED_CITIES.find((c) => normalizeName(c.name) === key)?.visual;
}
