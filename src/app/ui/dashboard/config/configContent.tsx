"use client"

import { usePathname } from "next/navigation"
import { CambiarContrasena } from "./changePassword"
import { BorrarCuenta } from "./deleteAccount"
import { HistorialBusqueda } from "./searchHistory"
import { Disponibilidad } from "./availability"
import { Notificaciones } from "./notifications"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function ConfigContent() {
  const pathname = usePathname()

  // Renderizar el contenido basado en la ruta actual
  const renderContent = () => {
    if (pathname.includes("cambiar-contrasena")) {
      return <CambiarContrasena />
    } else if (pathname.includes("borrar-cuenta")) {
      return <BorrarCuenta />
    } else if (pathname.includes("historial-busqueda")) {
      return <HistorialBusqueda />
    } else if (pathname.includes("disponibilidad")) {
      return <Disponibilidad />
    } else if (pathname.includes("notificaciones")) {
      return <Notificaciones />
    } else {
      // Página de inicio de configuración
      return (
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
            <CardDescription>
              Selecciona una opción del menú lateral para configurar tu cuenta y perfil.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Puedes administrar tu cuenta, cambiar tu contraseña, y personalizar tu perfil desde aquí.</p>
          </CardContent>
        </Card>
      )
    }
  }

  return <div className="w-full">{renderContent()}</div>
}
