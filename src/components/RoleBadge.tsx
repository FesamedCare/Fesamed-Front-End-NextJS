"use client";

import { ShieldCheck, Stethoscope, UserRound, type LucideIcon } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";
import { roleOf } from "@/lib/roles";

/**
 * Etiqueta con el rol de la cuenta. Antes no había forma de saber, al entrar,
 * si la cuenta era de doctor o de paciente: las dos veían su nombre y nada más.
 */
const STYLES: Record<"doctor" | "patient" | "admin", { icon: LucideIcon; label: TranslationKey; className: string }> = {
  doctor: { icon: Stethoscope, label: "roles.doctor", className: "bg-blue-50 text-blue-700 ring-blue-200" },
  patient: { icon: UserRound, label: "roles.patient", className: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
  admin: { icon: ShieldCheck, label: "roles.admin", className: "bg-violet-50 text-violet-700 ring-violet-200" },
};

export function RoleBadge({ role, size = "md" }: { role: unknown; size?: "sm" | "md" }) {
  const { t } = useTranslation();
  const r = roleOf(role);
  if (!r) return null;
  const { icon: Icon, label, className } = STYLES[r];
  const small = size === "sm";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ring-1 ring-inset ${className} ${
        small ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
      }`}
    >
      <Icon className={small ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      <span>
        <span className="sr-only">{t("roles.accountType")}: </span>
        {t(label)}
      </span>
    </span>
  );
}
