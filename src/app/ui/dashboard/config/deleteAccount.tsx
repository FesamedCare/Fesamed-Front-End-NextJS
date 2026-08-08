import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle } from "lucide-react"
import { useTranslation } from "@/i18n/LocaleProvider";

export function BorrarCuenta() {
  const { t } = useTranslation();
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          {t("ui.deleteAccountTitle")}
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          {t("settings.deleteWarning")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              {t("settings.deleteBody")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">{t("ui.deleteConfirmPrompt")}</Label>
            <Input id="confirm" placeholder={t("ui.deleteConfirmWord")} />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" className="w-full sm:w-auto">
          {t("ui.deleteAccountButton")}
        </Button>
      </CardFooter>
    </Card>
  )
}
