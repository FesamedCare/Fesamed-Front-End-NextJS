import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell } from "lucide-react"

export function Notificaciones() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notificaciones
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Configura cómo y cuándo quieres recibir notificaciones.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notificaciones por correo electrónico</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-updates">Actualizaciones importantes</Label>
                  <p className="text-xs text-gray-500">Recibe notificaciones sobre cambios importantes en tu cuenta</p>
                </div>
                <Switch id="email-updates" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-marketing">Boletines y ofertas</Label>
                  <p className="text-xs text-gray-500">Recibe información sobre nuevas funciones y promociones</p>
                </div>
                <Switch id="email-marketing" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Notificaciones en la aplicación</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="app-messages">Mensajes</Label>
                  <p className="text-xs text-gray-500">Notificaciones cuando recibes un nuevo mensaje</p>
                </div>
                <Switch id="app-messages" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="app-activity">Actividad de la cuenta</Label>
                  <p className="text-xs text-gray-500">Notificaciones sobre la actividad en tu cuenta</p>
                </div>
                <Switch id="app-activity" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="app-updates">Actualizaciones del sistema</Label>
                  <p className="text-xs text-gray-500">Notificaciones sobre actualizaciones y mantenimiento</p>
                </div>
                <Switch id="app-updates" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
