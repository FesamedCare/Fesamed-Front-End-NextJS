"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileCheck2, Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/LocaleProvider";
import { apiClient } from "@/lib/api";

type Pending = { document: "terms" | "privacy" | "data_processing"; version: string };

/**
 * Pide aceptar los documentos legales que falten antes de seguir usando la app.
 *
 * Aparece a quien se registró con Google (no pasó por las casillas del
 * registro), a las cuentas creadas antes de que existiera la constancia y a
 * todos cuando se publica una versión nueva de un documento. No se puede
 * cerrar: o se acepta, o se cierra sesión.
 */
export function LegalConsentGate() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { isAuthenticated, loading, user, logout } = useAuthContext();
  const [pending, setPending] = useState<Pending[]>([]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptData, setAcceptData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading || !isAuthenticated) {
      setPending([]);
      return;
    }
    apiClient<{ pending: Pending[] }>("/api/v1/me/legal-status/")
      .then((res) => setPending(res.pending))
      .catch(() => setPending([]));
  }, [loading, isAuthenticated, user?.email]);

  // Mientras lee los documentos, no se le tapan.
  if (!pending.length || pathname === "/terms" || pathname === "/privacy") return null;

  const needsTerms = pending.some((p) => p.document === "terms" || p.document === "privacy");
  const needsData = pending.some((p) => p.document === "data_processing");
  const ready = (!needsTerms || acceptTerms) && (!needsData || acceptData);

  const accept = async () => {
    setSaving(true);
    setError("");
    try {
      await apiClient("/api/v1/me/legal-acceptances/", {
        method: "POST",
        body: { documents: pending.map((p) => p.document) },
      });
      setPending([]);
    } catch {
      setError(t("consent.saveError"));
    } finally {
      setSaving(false);
    }
  };

  const linkClass = "font-medium text-blue-600 hover:underline";
  const box = "mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-300";
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/40 p-4" role="dialog" aria-modal="true" aria-labelledby="legal-gate-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
            <FileCheck2 className="h-5 w-5" aria-hidden />
          </span>
          <h2 id="legal-gate-title" className="text-lg font-semibold text-gray-900">{t("consent.gateTitle")}</h2>
        </div>
        <p className="mb-5 text-sm text-gray-600">{t("consent.gateBody")}</p>
        <div className="space-y-3 text-sm text-gray-600">
          {needsTerms && (
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={acceptTerms} onChange={(e) => setAcceptTerms(e.target.checked)} className={box} />
              <span>
                {t("consent.acceptPrefix")}{" "}
                <Link href="/terms" target="_blank" className={linkClass}>{t("consent.terms")}</Link>{" "}
                {t("consent.and")}{" "}
                <Link href="/privacy" target="_blank" className={linkClass}>{t("consent.privacy")}</Link>.
              </span>
            </label>
          )}
          {needsData && (
            <label className="flex items-start gap-3">
              <input type="checkbox" checked={acceptData} onChange={(e) => setAcceptData(e.target.checked)} className={box} />
              <span>
                {t("consent.dataAuthorization")}{" "}
                <Link href="/privacy#autorizacion" target="_blank" className={linkClass}>{t("consent.readMore")}</Link>
              </span>
            </label>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => logout()} className="rounded-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
            {t("nav.logout")}
          </button>
          <button
            type="button"
            onClick={accept}
            disabled={!ready || saving}
            className="flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("consent.acceptAndContinue")}
          </button>
        </div>
      </div>
    </div>
  );
}
