"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/LocaleProvider";
import { Disponibilidad } from "@/app/ui/dashboard/availability";
import Footer from "@/app/ui/navigation/footer";

export default function AvailabilityPage() {
  const { user, loading } = useAuthContext();
  const { t } = useTranslation();

  // El backend a veces devuelve el rol como string y a veces como objeto.
  // Mismo destrabe que usa el Navbar.
  const role =
    typeof user?.role === "string"
      ? user.role
      : (user?.role as { name?: string } | undefined)?.name;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // Los endpoints de horarios son sólo para doctores. Antes esta pantalla
  // aparecía en Configuración para cualquier rol y un paciente que entraba
  // recibía errores del servidor sin explicación.
  if (role !== "doctor") {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <p className="text-muted-foreground mb-4">
          {t("availability.doctorsOnly")}
        </p>
        <Link href="/dashboard" className="text-blue-500 underline">
          {t("availability.backToMyProfile")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 md:px-8 xl:px-16 py-8 max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              {t("availability.pageTitle")}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t("availability.pageSubtitle")}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-blue-500 hover:underline shrink-0"
          >
            {t("common.backToProfile")}
          </Link>
        </div>
        <Disponibilidad />
      </div>
      <Footer />
    </div>
  );
}
