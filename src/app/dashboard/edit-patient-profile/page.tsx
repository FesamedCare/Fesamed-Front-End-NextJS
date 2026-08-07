import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VerificationActionsCard } from "../../ui/dashboard/VerificationActionsCard";
import { PatientProfileForm } from "../../ui/dashboard/editProfile/patient-profile-form";
import { ProfilePictureUpload } from "../../ui/dashboard/editProfile/profile-picture-upload";
import Footer from "../../ui/navigation/footer";

export default function Page() {
  return (
    <div>
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-28 xl:px-16 pb-12">
        <Breadcrumb className="pb-5 pt-2 font-medium">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Perfil</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/edit-patient-profile">Editar Perfil</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <ProfilePictureUpload />

        <Card className="w-full mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Datos personales</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Estos datos los ve el profesional cuando agendas una cita con él.
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
