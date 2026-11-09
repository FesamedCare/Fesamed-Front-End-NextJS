"use client";

import { FileText } from "lucide-react";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";

/**
 * Página provisional de un documento legal.
 *
 * Los textos definitivos los está redactando la abogada. Mientras tanto la
 * página existe (los enlaces del registro, del aviso de aceptación, del footer
 * y de la pantalla de Google no dan 404) y dice con claridad que el documento
 * está en preparación. Para publicar el texto real: reemplazar el contenido y
 * subir la versión en la API (legal/documents.py), y todos volverán a aceptar.
 */
export function LegalPlaceholder({ title, withAuthorization = false }: { title: TranslationKey; withAuthorization?: boolean }) {
  const { t } = useTranslation();
  return (
    <main className="mx-auto min-h-[calc(100svh-6rem)] max-w-3xl px-6 py-12">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-600">
          <FileText className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="text-3xl font-semibold text-gray-900">{t(title)}</h1>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        {t("legal.inPreparation")}
      </div>
      <p className="mt-6 text-gray-600">{t("legal.placeholderBody")}</p>
      {withAuthorization && (
        <section id="autorizacion" className="mt-10 scroll-mt-28">
          <h2 className="text-xl font-semibold text-gray-900">{t("legal.authorizationTitle")}</h2>
          <p className="mt-3 text-gray-600">{t("legal.authorizationBody")}</p>
        </section>
      )}
      <p className="mt-10 text-sm text-gray-500">{t("legal.contact")}</p>
    </main>
  );
}
