"use client"

import { useCallback, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralProfileForm } from "./general-profile-form"
import { VerificationStatusCard } from "../VerificationStatusCard"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb";
import CertificatesForm from "./certificates-form";
import ConsultoriesForm from "./consultories-form";
import { ProfilePictureUpload } from "./profile-picture-upload";

  export default function DoctorProfileEdit() {
    // El backend recalcula el porcentaje en cada endpoint de mutación, pero la
    // tarjeta solo consultaba al montar. Cada guardado incrementa este contador
    // y la obliga a releer. Mismo mecanismo que doctor-dashboard.tsx.
    const [refresh, setRefresh] = useState(0);
    const onSaved = useCallback(() => setRefresh((n) => n + 1), []);

    return (
      <div className="max-w-5xl mx-auto px-4 md:px-8 lg:px-28 xl:px-16 pb-12">
        <VerificationStatusCard collapsible refreshTrigger={refresh} />
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
                        <BreadcrumbLink href="/dashboard/edit-profile">Editar Perfil</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
      <ProfilePictureUpload onSaved={onSaved} />
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="general" className="text-xs sm:text-sm md:text-sm py-2 h-auto">
            <span className="hidden sm:inline">Información General</span>
            <span className="sm:hidden">General</span>
          </TabsTrigger>
          <TabsTrigger value="certificates" className="text-xs sm:text-sm md:text-sm py-2 h-auto">
            Certificados
          </TabsTrigger>
          <TabsTrigger value="consultorios" className="text-xs sm:text-sm md:text-sm py-2 h-auto">
            Consultorios
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralProfileForm onSaved={onSaved} />
        </TabsContent>
        <TabsContent value="certificates">
          <CertificatesForm onSaved={onSaved} />
        </TabsContent>
        <TabsContent value="consultorios">
          <ConsultoriesForm onSaved={onSaved} />
        </TabsContent>
      </Tabs>
      </div>
    )
  }