"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralProfileForm } from "./general-profile-form"
import { ProfilePhotosForm } from "./profile-photos"
import { CertificatesForm } from "./certificates-form"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from "@/components/ui/breadcrumb";

  export default function DoctorProfileEdit() {
    return (
      <div className="container mx-auto px-4 md:px-8 lg:px-28 xl:px-16 pb-12 max-w-7xl">
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
            <h1 className="text-3xl font-bold mb-6 text-wrap-balance">Editar Perfil de Doctor</h1>
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
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
        </TabsList>
        <TabsContent value="general">
          <GeneralProfileForm />
        </TabsContent>
        <TabsContent value="photos">
          <ProfilePhotosForm />
        </TabsContent>
        <TabsContent value="certificates">
          <CertificatesForm />
        </TabsContent>
      </Tabs>
      </div>
    )
  }