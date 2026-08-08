/**
 * El sitio es en español. El inglés existe sólo como red de seguridad para
 * quien llega con el navegador en otro idioma.
 *
 * No hay rutas /es/ ni /en/ a propósito: el idioma se detecta y se guarda en
 * una cookie. Meter el locale en la URL habría obligado a reestructurar las 24
 * rutas del proyecto para algo que debe ser automático.
 */

export const LOCALES = ["es", "en"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "es";

export const LOCALE_COOKIE = "locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "es" || value === "en";
}

/** Países donde el español es lengua oficial. Se usa sólo como desempate. */
const SPANISH_SPEAKING_COUNTRIES = new Set([
  "AR", "BO", "CL", "CO", "CR", "CU", "DO", "EC", "ES", "GQ", "GT", "HN",
  "MX", "NI", "PA", "PE", "PR", "PY", "SV", "UY", "VE",
]);

interface LanguagePreference {
  tag: string;
  q: number;
}

/** Parsea un header Accept-Language respetando los q-values. */
function parseAcceptLanguage(header: string): LanguagePreference[] {
  return header
    .split(",")
    .map((part) => {
      const [rawTag, ...params] = part.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.split("=")[1]) : 1;
      return {
        tag: rawTag.trim().toLowerCase(),
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .filter((pref) => pref.tag.length > 0 && pref.tag !== "*")
    .sort((a, b) => b.q - a.q);
}

/**
 * Decide el idioma a partir de las señales del navegador.
 *
 * - Navegador en español (en cualquier variante) → español.
 * - Navegador en cualquier otro idioma → inglés, aunque no sea su idioma:
 *   entre "no entiende nada" y "entiende algo", inglés gana.
 * - Sin señal de idioma → manda el país, y si tampoco hay, español.
 */
export function detectLocale(
  acceptLanguage: string | null | undefined,
  country?: string | null
): Locale {
  if (acceptLanguage) {
    for (const { tag } of parseAcceptLanguage(acceptLanguage)) {
      const base = tag.split("-")[0];
      if (base === "es") return "es";
      if (base === "en") return "en";
    }
    // Pidió un idioma concreto y no es ninguno de los dos (francés, portugués…).
    return "en";
  }

  if (country) {
    return SPANISH_SPEAKING_COUNTRIES.has(country.toUpperCase()) ? "es" : "en";
  }

  return DEFAULT_LOCALE;
}
