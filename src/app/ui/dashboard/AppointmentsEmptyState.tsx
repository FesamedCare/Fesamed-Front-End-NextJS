"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";

type Tab = "proximas" | "pasadas" | "canceladas";

interface Props {
  tab: Tab;
  role: "patient" | "doctor";
}

/**
 * Calendario vacío.
 *
 * SVG en línea y no un asset: son cuatro formas, y así hereda `currentColor`
 * y el tamaño del contenedor sin una petición extra ni un archivo que
 * mantener aparte.
 */
function EmptyCalendar() {
  return (
    <svg
      viewBox="0 0 200 160"
      className="w-44 h-36"
      role="img"
      aria-hidden="true"
      fill="none"
    >
      {/* Sombra de apoyo: ancla la ilustración para que no flote sin peso */}
      <ellipse cx="100" cy="147" rx="58" ry="7" className="fill-blue-100/70" />

      {/* Anillos de la agenda */}
      <rect x="62" y="18" width="6" height="18" rx="3" className="fill-blue-300" />
      <rect x="132" y="18" width="6" height="18" rx="3" className="fill-blue-300" />

      {/* Cuerpo */}
      <rect
        x="38"
        y="28"
        width="124"
        height="108"
        rx="14"
        className="fill-white stroke-blue-200"
        strokeWidth="2"
      />
      <path
        d="M38 42a14 14 0 0 1 14-14h96a14 14 0 0 1 14 14v10H38V42Z"
        className="fill-blue-500"
      />

      {/* Días vacíos */}
      {[0, 1, 2, 3].map((col) =>
        [0, 1, 2].map((row) => {
          const cx = 62 + col * 26;
          const cy = 72 + row * 22;
          const isAccent = col === 2 && row === 1;
          return (
            <circle
              key={`${col}-${row}`}
              cx={cx}
              cy={cy}
              r={isAccent ? 6 : 4.5}
              className={
                isAccent
                  ? "fill-blue-200 motion-safe:animate-breathe"
                  : "fill-gray-100"
              }
            />
          );
        })
      )}

      {/* Reloj: el único elemento que se mueve, para que el ojo tenga un foco */}
      <g className="motion-safe:animate-float-soft">
        <circle cx="150" cy="112" r="22" className="fill-white" />
        <circle
          cx="150"
          cy="112"
          r="18"
          className="fill-blue-50 stroke-blue-500"
          strokeWidth="2.5"
        />
        <path
          d="M150 103v10l7 4"
          className="stroke-blue-500"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function AppointmentsEmptyState({ tab, role }: Props) {
  const { t } = useTranslation();

  // Los tres estados no dicen lo mismo: "no tienes citas" es una invitación a
  // agendar, "no hay pasadas" es sólo un hecho. Sólo el primero lleva acción.
  const titleKey: TranslationKey =
    tab === "proximas"
      ? "empty.upcomingTitle"
      : tab === "pasadas"
      ? "empty.pastTitle"
      : "empty.canceledTitle";

  const bodyKey: TranslationKey =
    tab === "proximas"
      ? role === "doctor"
        ? "empty.upcomingDoctorBody"
        : "empty.upcomingPatientBody"
      : tab === "pasadas"
      ? "empty.pastBody"
      : "empty.canceledBody";

  const action =
    tab === "proximas"
      ? role === "doctor"
        ? { href: "/dashboard/availability", labelKey: "empty.doctorCta" as const }
        : { href: "/buscar-doctor", labelKey: "empty.patientCta" as const }
      : null;

  return (
    <div className="flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-blue-200 bg-gradient-to-b from-blue-50/60 to-white px-6 py-14">
      <EmptyCalendar />

      <h3 className="mt-6 text-lg font-semibold text-gray-900">
        {t(titleKey)}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500">
        {t(bodyKey)}
      </p>

      {action && (
        <Button asChild className="mt-6 rounded-full px-6">
          <Link href={action.href}>{t(action.labelKey)}</Link>
        </Button>
      )}
    </div>
  );
}
