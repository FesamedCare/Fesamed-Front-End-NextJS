"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/i18n/LocaleProvider";

type State = "loading" | "success" | "error";

function VerifyEmailContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage(t("auth.missingToken"));
      return;
    }

    apiClient("/api/v1/verify-email/", {
      method: "POST",
      body: { token },
    })
      .then(() => {
        setState("success");
      })
      .catch((e) => {
        setState("error");
        setMessage(e instanceof Error ? e.message : t("auth.invalidToken"));
      });
    // `t` es estable por idioma (viene de un useMemo en el provider), así que
    // incluirlo no reejecuta la verificación salvo que el usuario cambie de
    // idioma en esta misma pantalla.
  }, [token, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-sm border p-10 max-w-md w-full text-center space-y-4">
        {state === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-600">{t("auth.verifying")}</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-800">{t("auth.verifiedTitle")}</h1>
            <p className="text-gray-500 text-sm">
              {t("auth.verifiedBody")}
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 mt-2">
              <Link href="/dashboard">{t("auth.goToDashboard")}</Link>
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-800">{t("auth.verifyErrorTitle")}</h1>
            <p className="text-gray-500 text-sm">{message}</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard">{t("auth.backToDashboard")}</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
