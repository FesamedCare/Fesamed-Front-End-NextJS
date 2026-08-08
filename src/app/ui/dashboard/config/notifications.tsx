import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell } from "lucide-react"
import { useTranslation } from "@/i18n/LocaleProvider";

export function Notificaciones() {
  const { t } = useTranslation();
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Bell className="h-5 w-5" />
          {t("ui.notifications")}
        </CardTitle>
        <CardDescription className="text-sm md:text-base">
          {t("settings.notificationsIntro")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t("settings.emailNotifications")}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-updates">{t("ui.importantUpdates")}</Label>
                  <p className="text-xs text-gray-500">{t("ui.importantUpdatesDesc")}</p>
                </div>
                <Switch id="email-updates" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-marketing">{t("ui.newslettersOffers")}</Label>
                  <p className="text-xs text-gray-500">{t("settings.emailNotificationsDesc")}</p>
                </div>
                <Switch id="email-marketing" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t("settings.appNotifications")}</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="app-messages">{t("settings.messages")}</Label>
                  <p className="text-xs text-gray-500">{t("ui.newMessageDesc")}</p>
                </div>
                <Switch id="app-messages" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="app-activity">{t("ui.accountActivity")}</Label>
                  <p className="text-xs text-gray-500">{t("ui.accountActivityDesc")}</p>
                </div>
                <Switch id="app-activity" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="app-updates">{t("ui.systemUpdates")}</Label>
                  <p className="text-xs text-gray-500">{t("ui.systemUpdatesDesc")}</p>
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
