import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"

export function BorrarCuenta() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          Borrar cuenta
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          Esta acción es permanente y no se puede deshacer. Se eliminarán todos tus datos y no podrás recuperarlos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              Al eliminar tu cuenta, perderás acceso a todos tus datos, incluyendo tu historial, configuraciones y
              archivos personales.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Para confirmar, escribe &quot;BORRAR&quot; en el campo de abajo</Label>
            <Input id="confirm" placeholder="BORRAR" />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" className="w-full sm:w-auto">
          Borrar mi cuenta permanentemente
        </Button>
      </CardFooter>
    </Card>
  )
}
