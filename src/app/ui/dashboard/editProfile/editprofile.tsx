"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralProfileForm } from "./general-profile-form"
import { CertificatesForm } from "./certificates-form"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb";
import UploadForm from "./profile-photos";

  export default function DoctorProfileEdit() {
    return (
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
                        <BreadcrumbLink href="/dashboard/edit-profile">Editar Perfil</BreadcrumbLink>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="general" className="text-xs sm:text-sm md:text-sm py-2 h-auto">
            <span className="hidden sm:inline">Información General</span>
            <span className="sm:hidden">General</span>
          </TabsTrigger>
          <TabsTrigger value="photos" className="text-xs sm:text-sm md:text-sm py-2 h-auto">
            Fotos
          </TabsTrigger>
          <TabsTrigger value="certificates" className="text-xs sm:text-sm md:text-sm py-2 h-auto">
            Certificados
          </TabsTrigger>
          <TabsTrigger value="consultorios" className="text-xs sm:text-sm md:text-sm py-2 h-auto">
            Consultorios
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general">
          <GeneralProfileForm />
        </TabsContent>
        <TabsContent value="photos">
          <UploadForm />
        </TabsContent>
        <TabsContent value="certificates">
          <CertificatesForm />
        </TabsContent>
        <TabsContent value="Consultorios">
          <CertificatesForm />
        </TabsContent>
      </Tabs>
      </div>
    )
  }