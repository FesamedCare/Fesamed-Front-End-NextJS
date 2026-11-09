"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle2, X } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";

/**
 * Aviso de una línea tras un cambio en la cuenta. La página de destino recibe
 * `?cuenta=reactivada|desactivada|eliminada`; el aviso se muestra unos
 * segundos y el parámetro se quita de la URL para que no reaparezca al
 * recargar o compartir el enlace.
 */
const MESSAGES: Record<string, TranslationKey> = {
  reactivada: "account.noticeReactivated",
  desactivada: "account.noticeDeactivated",
  eliminada: "account.noticeDeleted",
};

export function AccountNotice() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [message, setMessage] = useState<TranslationKey | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("cuenta");
    if (!key || !MESSAGES[key]) return;
    setMessage(MESSAGES[key]);
    params.delete("cuenta");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    const timer = setTimeout(() => setMessage(null), 8000);
    return () => clearTimeout(timer);
  }, [pathname]);

  if (!message) return null;
  return (
    <div role="status" className="fixed inset-x-0 top-24 z-50 flex justify-center px-4">
      <div className="flex max-w-lg items-start gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm text-gray-700 shadow-lg">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        <p>{t(message)}</p>
        <button type="button" onClick={() => setMessage(null)} aria-label={t("account.close")} className="text-gray-400 hover:text-gray-600">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
