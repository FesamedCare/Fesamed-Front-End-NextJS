"use client";

import Link from "next/link";
import { useTranslation } from "@/i18n/LocaleProvider";

/**
 * Casillas de aceptación del registro.
 *
 * Son dos a propósito: la Ley 1581 pide que la autorización para tratar datos
 * personales sea expresa y separada de los términos de uso. La API exige las
 * dos y guarda la constancia (versión, fecha, IP).
 */
export function ConsentCheckboxes({
  acceptTerms,
  onAcceptTerms,
  acceptData,
  onAcceptData,
}: {
  acceptTerms: boolean;
  onAcceptTerms: (value: boolean) => void;
  acceptData: boolean;
  onAcceptData: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const linkClass = "font-medium text-blue-600 hover:underline";
  const box = "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-300";
  return (
    <div className="space-y-3 text-sm text-gray-600">
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={acceptTerms} onChange={(e) => onAcceptTerms(e.target.checked)} className={box} />
        <span>
          {t("consent.acceptPrefix")}{" "}
          <Link href="/terms" target="_blank" className={linkClass}>{t("consent.terms")}</Link>{" "}
          {t("consent.and")}{" "}
          <Link href="/privacy" target="_blank" className={linkClass}>{t("consent.privacy")}</Link>.
        </span>
      </label>
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={acceptData} onChange={(e) => onAcceptData(e.target.checked)} className={box} />
        <span>
          {t("consent.dataAuthorization")}{" "}
          <Link href="/privacy#autorizacion" target="_blank" className={linkClass}>{t("consent.readMore")}</Link>
        </span>
      </label>
    </div>
  );
}
