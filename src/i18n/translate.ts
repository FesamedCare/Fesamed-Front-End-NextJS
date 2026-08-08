/**
 * Núcleo de traducción, sin React y sin "use client".
 *
 * Vive aparte del provider a propósito: así los server components pueden
 * traducir sin convertirse en client components sólo para leer un texto.
 */
import { es, type Dictionary } from "./dictionaries/es";
import { en } from "./dictionaries/en";
import { DEFAULT_LOCALE, type Locale } from "./config";

export const DICTIONARIES: Record<Locale, Dictionary> = { es, en };

/**
 * Claves válidas, derivadas del diccionario español.
 * `t("availability.pageTitle")` compila; `t("availability.pageTitel")` no.
 */
export type TranslationKey = {
  [N in keyof Dictionary]: `${N & string}.${keyof Dictionary[N] & string}`;
}[keyof Dictionary];

export type TranslationValues = Record<string, string | number>;

export type Translator = (
  key: TranslationKey,
  values?: TranslationValues
) => string;

function lookup(dict: Dictionary, key: TranslationKey): string | undefined {
  const [namespace, entry] = key.split(".") as [keyof Dictionary, string];
  const section = dict[namespace] as Record<string, string> | undefined;
  return section?.[entry];
}

/** Reemplaza `{nombre}` por el valor correspondiente. */
function interpolate(template: string, values?: TranslationValues): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match
  );
}

export function createTranslator(locale: Locale): Translator {
  const dict = DICTIONARIES[locale] ?? DICTIONARIES[DEFAULT_LOCALE];
  return (key, values) => {
    // El español es la fuente: si una clave faltara en inglés (el tipo lo
    // impide, pero por si acaso) se muestra el español antes que la clave cruda.
    const text = lookup(dict, key) ?? lookup(es, key);
    return interpolate(text ?? key, values);
  };
}
