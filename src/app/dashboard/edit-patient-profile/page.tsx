"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationActionsCard } from "../../ui/dashboard/VerificationActionsCard";
import { PatientProfileForm } from "../../ui/dashboard/editProfile/patient-profile-form";
import { ProfilePictureUpload } from "../../ui/dashboard/editProfile/profile-picture-upload";
import Footer from "../../ui/navigation/footer";
import { useTranslation } from "@/i18n/LocaleProvider";
import { DashboardBreadcrumb } from "@/app/ui/dashboard/DashboardBreadcrumb";

export default function Page() {
  const { t } = useTranslation();
  return (
    <div>
      <div className="container mx-auto px-4 md:px-8 lg:px-28 xl:px-16 pb-12 max-w-7xl">
        <DashboardBreadcrumb current={t("dashboard.editProfile")} />

        <ProfilePictureUpload />

        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle className="text-xl">{t("misc.personalData")}</CardTitle>
            <CardDescription className="text-sm md:text-base">
              {t("misc.personalDataHint")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PatientProfileForm />
          </CardContent>
        </Card>

        {/*
          Verificar correo y teléfono es lo único que el backend exige para
          agendar, en appointments/router.py. Por eso la tarjeta va acá y no
          solo en el dashboard: es el paso que destraba pedir una cita.
        */}
        <VerificationActionsCard />
      </div>
      <Footer />
    </div>
  );
}
