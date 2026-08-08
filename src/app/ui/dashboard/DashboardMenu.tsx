"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DashboardMenuItem {
  icon: ComponentType<{ className?: string }>;
  label: string;
  /** Navega. Usa Link, no window.location: la app no se recarga entera. */
  href?: string;
  /** Acción en la misma página (cerrar sesión, por ejemplo). */
  onClick?: () => void;
  /** `danger` para acciones destructivas. */
  tone?: "default" | "danger";
}

const ROW =
  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1";

/** Cuadrito con el icono: da a cada fila un ancla visual de ancho fijo. */
function IconTile({
  icon: Icon,
  tone,
}: {
  icon: DashboardMenuItem["icon"];
  tone: "default" | "danger" | "muted";
}) {
  return (
    <span
      className={cn(
        "grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors",
        tone === "danger"
          ? "bg-red-50 text-red-500"
          : tone === "muted"
          ? "bg-gray-100 text-gray-400"
          : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

export function DashboardMenu({ items }: { items: DashboardMenuItem[] }) {
  return (
    <nav className="rounded-xl border border-gray-100 bg-white p-2 shadow-sm">
      {items.map((item, i) => {
        const danger = item.tone === "danger";
        const isLast = i === items.length - 1;

        // Sin href y sin onClick la fila no hace nada. Antes se veía idéntica a
        // las que sí funcionan (cursor pointer, hover, chevron) y el usuario
        // hacía clic al vacío. Ahora se muestra apagada y no recibe foco.
        const inert = !item.href && !item.onClick;

        const content = (
          <>
            <IconTile
              icon={item.icon}
              tone={inert ? "muted" : danger ? "danger" : "default"}
            />
            <span
              className={cn(
                "flex-1 truncate",
                inert
                  ? "text-gray-400"
                  : danger
                  ? "font-medium text-red-600"
                  : "text-gray-700"
              )}
            >
              {item.label}
            </span>
            {!inert && (
              <ChevronRight
                className={cn(
                  "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                  danger ? "text-red-300" : "text-gray-300"
                )}
              />
            )}
          </>
        );

        // Separador antes de la acción destructiva, para que cerrar sesión no
        // quede a un pixel de "Términos y condiciones".
        const wrapper = cn(danger && !isLast && "mb-1", danger && "mt-1 border-t border-gray-100 pt-2");

        if (inert) {
          return (
            <div
              key={item.label}
              aria-disabled="true"
              className={cn(ROW, "cursor-default")}
            >
              {content}
            </div>
          );
        }

        if (item.href) {
          return (
            <div key={item.label} className={wrapper}>
              <Link href={item.href} className={cn(ROW, "hover:bg-blue-50/70")}>
                {content}
              </Link>
            </div>
          );
        }

        return (
          <div key={item.label} className={wrapper}>
            <button
              type="button"
              onClick={item.onClick}
              className={cn(ROW, danger ? "hover:bg-red-50" : "hover:bg-blue-50/70")}
            >
              {content}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
