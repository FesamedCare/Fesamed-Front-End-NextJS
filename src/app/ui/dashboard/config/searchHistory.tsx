import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, Trash } from "lucide-react"
import { useTranslation } from "@/i18n/LocaleProvider";

export function HistorialBusqueda() {
  const { t } = useTranslation();
  // Datos de ejemplo para el historial de búsqueda
  const historialItems = [
    { id: 1, query: "Cómo mejorar el rendimiento de mi sitio web", fecha: "12 Abr 2025" },
    { id: 2, query: "Mejores prácticas de SEO", fecha: "10 Abr 2025" },
    { id: 3, query: "Tutoriales de Next.js", fecha: "8 Abr 2025" },
    { id: 4, query: "Componentes de Tailwind CSS", fecha: "5 Abr 2025" },
    { id: 5, query: "Optimización de imágenes", fecha: "2 Abr 2025" },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Search className="h-5 w-5" />
          {t("settings.searchHistory")}
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          {t("settings.searchHistoryIntro")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="text-sm">
              <Trash className="h-4 w-4 mr-2" />
              {t("ui.clearAllHistory")}
            </Button>
          </div>

          <div className="space-y-2">
            {historialItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm md:text-base">{item.query}</p>
                  <p className="text-xs text-gray-500">{item.fecha}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">{t("settings.removeItem")}</span>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
