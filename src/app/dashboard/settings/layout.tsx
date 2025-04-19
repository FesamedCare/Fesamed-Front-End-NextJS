"use client"

import { useState, useCallback } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { ConfigSidebar } from "@/app/ui/dashboard/config/configSideBar"

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Mantener el estado de la barra lateral en el layout para que persista entre navegaciones
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Crear manejador de eventos para la barra lateral
  const handleOpenChange = useCallback((open: boolean) => {
    setSidebarOpen(open)
  }, [])

  return (
    <div className="container mx-auto py-4 px-4 md:py-6 md:px-6">
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        <div className="w-full lg:w-[350px] shrink-0">
          <SidebarProvider 
            open={sidebarOpen} 
            onOpenChange={handleOpenChange}
          >
            <ConfigSidebar />
          </SidebarProvider>
        </div>
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  )
} 