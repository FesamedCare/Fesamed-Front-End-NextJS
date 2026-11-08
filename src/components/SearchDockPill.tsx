"use client";

import { useLayoutEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useSearchDock } from "@/contexts/SearchDockContext";
import { useTranslation } from "@/i18n/LocaleProvider";
import { morphFrom } from "@/lib/morph";

/**
 * Versión compacta de la barra de búsqueda, dentro de la navbar.
 *
 * Al montarse arranca con la forma de la barra grande que acaba de acoplarse y
 * se encoge hasta su tamaño (ver `morphFrom`). Muestra lo que el usuario ya
 * eligió y, al pulsarla, devuelve la barra completa.
 */
export function SearchDockPill() {
  const { t } = useTranslation();
  const { summary, expand, lastRect, pillEl } = useSearchDock();
  const ref = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    pillEl.current = el;
    if (lastRect.current) {
      morphFrom(el, lastRect.current);
      lastRect.current = null;
    }
    return () => {
      if (pillEl.current === el) pillEl.current = null;
    };
  }, [lastRect, pillEl]);

  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={expand}
      aria-label={t("search.openSearch")}
      data-search-pill
      className="pointer-events-auto mt-2 flex h-12 max-w-[min(34rem,42vw)] items-center rounded-full border border-gray-200 bg-white pl-5 pr-2 shadow-md transition-shadow hover:shadow-lg"
    >
      {/* El texto entra cuando la píldora ya casi tiene su tamaño, para que no
          se vea apretado mientras se encoge. */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.12, duration: 0.16, ease: "easeOut" }}
        className="flex min-w-0 items-center gap-3 whitespace-nowrap text-sm"
      >
        <span className="truncate font-medium text-gray-900">{summary.where || t("search.pillAnyWhere")}</span>
        <span aria-hidden className="h-5 w-px shrink-0 bg-gray-200" />
        <span className="truncate font-medium text-gray-900">
          {summary.specialty || t("search.pillAnySpecialty")}
        </span>
        <span aria-hidden className="h-5 w-px shrink-0 bg-gray-200" />
        <span className={`truncate ${summary.query ? "text-gray-900" : "text-gray-500"}`}>
          {summary.query || t("search.query")}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <Search className="h-3.5 w-3.5" strokeWidth={2.75} />
        </span>
      </motion.span>
    </motion.button>
  );
}
