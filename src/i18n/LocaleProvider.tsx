"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "./config";
import { createTranslator, type Translator } from "./translate";

export type { TranslationKey } from "./translate";

interface LocaleContextValue {
  locale: Locale;
  t: Translator;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: createTranslator(DEFAULT_LOCALE),
  setLocale: () => {},
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const t = useMemo(() => createTranslator(locale), [locale]);

  const setLocale = useCallback((next: Locale) => {
    // Un año. La elección manual gana sobre la detección del navegador porque
    // el middleware sólo escribe la cookie cuando no existe.
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
    window.location.reload();
  }, []);

  const value = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LocaleContext);
}
