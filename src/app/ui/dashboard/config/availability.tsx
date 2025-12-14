import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Clock } from "lucide-react"

export function Disponibilidad() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Disponibilidad
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Configura tu disponibilidad y estado de actividad.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Estado de actividad</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="online">Mostrar como en línea</Label>
                  <p className="text-xs text-gray-500">Otros usuarios podrán ver cuando estás activo</p>
                </div>
                <Switch id="online" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="status">Mostrar estado de actividad</Label>
                  <p className="text-xs text-gray-500">Muestra cuándo fue la última vez que estuviste activo</p>
                </div>
                <Switch id="status" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Horario de disponibilidad</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="schedule">Mostrar horario de disponibilidad</Label>
                  <p className="text-xs text-gray-500">Otros usuarios podrán ver tu horario de disponibilidad</p>
                </div>
                <Switch id="schedule" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto">Modo no molestar automático</Label>
                  <p className="text-xs text-gray-500">Activar automáticamente el modo no molestar fuera del horario</p>
                </div>
                <Switch id="auto" defaultChecked />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
