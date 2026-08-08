"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Award, Building2 } from "lucide-react"
import { GeneralProfileForm } from "./general-profile-form"
import { VerificationStatusCard } from "../VerificationStatusCard"
import { DashboardBreadcrumb } from "../DashboardBreadcrumb"
import CertificatesForm from "./certificates-form";
import ConsultoriesForm from "./consultories-form";
import { ProfilePictureUpload } from "./profile-picture-upload";
import { useTranslation } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

/**
 * Clases del disparador de sección.
 *
 * En escritorio son filas verticales, con el mismo lenguaje que el menú del
 * dashboard (cuadrito de icono, fila redondeada, activo en azul). En móvil la
 * lista se vuelve un control segmentado, igual que las pestañas de citas.
 * Es la misma navegación en dos formas, no dos componentes distintos.
 */
const TRIGGER = cn(
  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
  "justify-center sm:justify-start flex-1 sm:flex-none sm:w-full",
  "text-gray-600 hover:bg-blue-50/70",
  "data-[state=active]:bg-blue-50 data-[state=active]:font-semibold data-[state=active]:text-blue-700",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
);

const TILE = cn(
  "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gray-100 text-gray-500 transition-colors",
  "group-hover:bg-blue-100 group-hover:text-blue-600",
  "group-data-[state=active]:bg-blue-500 group-data-[state=active]:text-white"
);

export default function DoctorProfileEdit() {
  const { t } = useTranslation();

  const sections = [
    { value: "general", icon: User, label: t("misc.generalInfo"), short: t("misc.general") },
    { value: "certificates", icon: Award, label: t("ui.certificates"), short: t("ui.certificates") },
    { value: "consultorios", icon: Building2, label: t("ui.offices"), short: t("ui.offices") },
  ];

  return (
    // Mismo contenedor que el dashboard. Antes era max-w-5xl y por eso la
    // migaja de pan saltaba de posición al entrar aquí.
    <div className="container mx-auto px-4 md:px-8 lg:px-28 xl:px-16 pb-12 max-w-7xl">
      {/* Migaja primero y aviso después, igual que en el dashboard */}
      <DashboardBreadcrumb current={t("dashboard.editProfile")} />

      <div className="w-full mb-4">
        <VerificationStatusCard collapsible />
      </div>

      <Tabs defaultValue="general" className="w-full">
        <div className="grid gap-6 md:grid-cols-[280px,1fr] md:items-start">
          {/* ── Columna izquierda: identidad + navegación ── */}
          <div className="space-y-4 md:sticky md:top-24">
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="h-16 rounded-t-xl bg-gradient-to-b from-blue-100 to-blue-50/40" />
              <div className="-mt-12 px-4 pb-2">
                <ProfilePictureUpload />
              </div>
            </div>

            <TabsList className="flex h-auto w-full gap-1 rounded-xl border border-gray-100 bg-white p-2 shadow-sm sm:flex-col">
              {sections.map((s) => (
                <TabsTrigger key={s.value} value={s.value} className={TRIGGER}>
                  <span className={TILE}>
                    <s.icon className="h-4 w-4" />
                  </span>
                  <span className="hidden sm:inline truncate">{s.label}</span>
                  <span className="sm:hidden truncate">{s.short}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* ── Columna derecha: el formulario de la sección ── */}
          <div className="min-w-0 rounded-xl border border-gray-100 bg-white p-5 shadow-sm md:p-6">
            <TabsContent value="general" className="mt-0">
              <GeneralProfileForm />
            </TabsContent>
            <TabsContent value="certificates" className="mt-0">
              <CertificatesForm />
            </TabsContent>
            <TabsContent value="consultorios" className="mt-0">
              <ConsultoriesForm />
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  )
}
