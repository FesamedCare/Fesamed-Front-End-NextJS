"use client";

import { useMemo } from "react";
import { addDays, format, startOfToday, startOfWeek } from "date-fns";
import { enUS, es } from "date-fns/locale";
import { useTranslation } from "@/i18n/LocaleProvider";

/**
 * Iniciales de los días de la semana en el idioma activo, empezando en lunes.
 *
 * Existe como hook porque estaba escrito a mano en tres pantallas y en dos de
 * ellas la lista era fija en español (`["Lu","Ma","Mi",…]`), así que con el
 * sitio en inglés seguían saliendo en español.
 *
 * Lunes primero en ambos idiomas: es como están dibujadas las grillas, cuyo
 * cálculo de offset asume lunes en la primera columna.
 */
export function useWeekdayLabels(): string[] {
  const { locale } = useTranslation();
  const dateLocale = locale === "en" ? enUS : es;

  return useMemo(() => {
    const inicio = startOfWeek(startOfToday(), { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(inicio, i), "EEEEEE", { locale: dateLocale })
    );
  }, [dateLocale]);
}
