"use client"

import { usePathname } from "next/navigation"
import { CambiarContrasena } from "./changePassword"
import { BorrarCuenta } from "./deleteAccount"
import { HistorialBusqueda } from "./searchHistory"
import { Notificaciones } from "./notifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslation } from "@/i18n/LocaleProvider";

export function ConfigContent() {
  const { t } = useTranslation();
  const pathname = usePathname()

  // Renderizar el contenido basado en la ruta actual
  const renderContent = () => {
    if (pathname.includes("cambiar-contrasena")) {
      return <CambiarContrasena />
    } else if (pathname.includes("borrar-cuenta")) {
      return <BorrarCuenta />
    } else if (pathname.includes("historial-busqueda")) {
      return <HistorialBusqueda />
    } else if (pathname.includes("notificaciones")) {
      return <Notificaciones />
    } else {
      // Página de inicio de configuración
      return (
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.title")}</CardTitle>
            <CardDescription>
              {t("settings.intro")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{t("settings.introBody")}</p>
          </CardContent>
        </Card>
      )
    }
  }

  return <div className="w-full">{renderContent()}</div>
}
