"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";

type State = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setMessage("No se encontró el token de verificación en el enlace.");
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
        setMessage(e instanceof Error ? e.message : "Token inválido o expirado.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-xl shadow-sm border p-10 max-w-md w-full text-center space-y-4">
        {state === "loading" && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-600">Verificando tu correo...</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-800">¡Correo verificado!</h1>
            <p className="text-gray-500 text-sm">
              Tu correo electrónico ha sido verificado exitosamente.
            </p>
            <Button asChild className="bg-blue-600 hover:bg-blue-700 mt-2">
              <Link href="/dashboard">Ir al dashboard</Link>
            </Button>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="h-12 w-12 text-red-500 mx-auto" />
            <h1 className="text-xl font-semibold text-gray-800">Error de verificación</h1>
            <p className="text-gray-500 text-sm">{message}</p>
            <Button asChild variant="outline" className="mt-2">
              <Link href="/dashboard">Volver al dashboard</Link>
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
