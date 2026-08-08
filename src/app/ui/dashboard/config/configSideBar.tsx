"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronRight, Lock, User, History, Bell, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePathname, useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useTranslation } from "@/i18n/LocaleProvider"

// Estado global para mantener las secciones expandidas entre navegaciones
let activeDropdownSections = new Set<string>()

export function ConfigSidebar() {
  const { t } = useTranslation();
  const pathname = usePathname()
  const router = useRouter()
  const [activeSections, setActiveSections] = useState<Set<string>>(activeDropdownSections)
  const firstRender = useRef(true)

  // Determinar la sección activa basada en la ruta solo en el primer renderizado
  useEffect(() => {
    if (firstRender.current) {
      const sectionsToActivate = new Set(activeSections)
      
      if (pathname.includes("cuenta") || pathname.includes("contrasena") || pathname.includes("borrar")) {
        sectionsToActivate.add("cuenta")
      }
      
      if (pathname.includes("perfil") ||
          pathname.includes("historial") ||
          pathname.includes("notificaciones")) {
        sectionsToActivate.add("perfil")
      }
      
      setActiveSections(sectionsToActivate)
      activeDropdownSections = sectionsToActivate
      firstRender.current = false
    }
  }, [pathname, activeSections])

  const isActive = (path: string) => pathname === path || pathname.includes(path)

  const handleMenuClick = (section: string) => {
    setActiveSections(prev => {
      const newSections = new Set(prev)
      if (newSections.has(section)) {
        newSections.delete(section)
      } else {
        newSections.add(section)
      }
      activeDropdownSections = newSections
      return newSections
    })
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  return (
    <Sidebar className="w-full h-auto rounded-lg border border-gray-200 shadow-sm overflow-hidden" collapsible="none">
      <SidebarContent className="p-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="w-[calc(100%-10px)] mx-auto overflow-hidden">
              {/* Cuenta y seguridad */}
              <SidebarMenuItem className="mb-2">
                <div
                  className={cn(
                    "flex items-center justify-between w-full p-3 md:p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
                    activeSections.has("cuenta") ? "bg-gray-50" : "",
                  )}
                  onClick={() => handleMenuClick("cuenta")}
                >
                  <div className="flex items-center gap-3 pr-2 max-w-[80%]">
                    <Lock className="h-5 w-5 text-gray-700 flex-shrink-0" />
                    <span className="font-medium">{t("settings.accountSecurity")}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 text-gray-500 transition-transform duration-200 flex-shrink-0",
                      activeSections.has("cuenta") ? "rotate-90" : "",
                    )}
                  />
                </div>
              </SidebarMenuItem>

              {activeSections.has("cuenta") && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/settings/change-password")}
                      className="ml-6 md:ml-8 text-sm py-2 rounded-md w-[calc(100%-2rem)]"
                    >
                      <button onClick={() => navigateTo("/dashboard/settings/change-password")}
                        className="flex items-center w-full px-2">
                        <span>{t("settings.changePassword")}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/settings/delete-account")}
                      className="ml-6 md:ml-8 text-sm py-2 rounded-md w-[calc(100%-2rem)]"
                    >
                      <button onClick={() => navigateTo("/dashboard/settings/delete-account")}
                        className="flex items-center w-full px-2">
                        <Trash2 className="h-4 w-4 flex-shrink-0 mr-2" />
                        <span>{t("settings.deleteAccount")}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}

              {/* Perfil y visibilidad */}
              <SidebarMenuItem className="mt-2">
                <div
                  className={cn(
                    "flex items-center justify-between w-full p-3 md:p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors",
                    activeSections.has("perfil") ? "bg-gray-50" : "",
                  )}
                  onClick={() => handleMenuClick("perfil")}
                >
                  <div className="flex items-center gap-3 pr-2 max-w-[80%]">
                    <User className="h-5 w-5 text-gray-700 flex-shrink-0" />
                    <span className="font-medium">{t("settings.profileVisibility")}</span>
                  </div>
                  <ChevronRight
                    className={cn(
                      "h-5 w-5 text-gray-500 transition-transform duration-200 flex-shrink-0",
                      activeSections.has("perfil") ? "rotate-90" : "",
                    )}
                  />
                </div>
              </SidebarMenuItem>

              {activeSections.has("perfil") && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/settings/search-history")}
                      className="ml-6 md:ml-8 text-sm py-2 rounded-md w-[calc(100%-2rem)]"
                    >
                      <button onClick={() => navigateTo("/dashboard/settings/search-history")}
                        className="flex items-center w-full px-2">
                        <History className="h-4 w-4 flex-shrink-0 mr-2" />
                        <span>{t("settings.searchHistory")}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive("/dashboard/settings/notifications")}
                      className="ml-6 md:ml-8 text-sm py-2 rounded-md w-[calc(100%-2rem)]"
                    >
                      <button onClick={() => navigateTo("/dashboard/settings/notifications")}
                        className="flex items-center w-full px-2">
                        <Bell className="h-4 w-4 flex-shrink-0 mr-2" />
                        <span>{t("settings.notifications")}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
