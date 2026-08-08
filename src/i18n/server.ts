// Sin `server-only`: no está en las dependencias del proyecto y `next/headers`
// ya rompe el build si esto se importa desde un client component.
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { createTranslator, type Translator } from "./translate";

/** Idioma activo según la cookie que escribe el middleware. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/**
 * Traductor para server components. Leer la cookie vuelve dinámico el render
 * de quien llame a esto, que es el precio de mandar el idioma correcto ya en
 * el HTML en vez de corregirlo después de hidratar.
 */
export async function getTranslations(): Promise<{
  locale: Locale;
  t: Translator;
}> {
  const locale = await getLocale();
  return { locale, t: createTranslator(locale) };
}
