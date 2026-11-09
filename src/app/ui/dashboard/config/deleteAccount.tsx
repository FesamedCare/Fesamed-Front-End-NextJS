"use client"

import { useState } from "react"
import { AlertTriangle, Loader2, PauseCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslation } from "@/i18n/LocaleProvider"
import { useAuthContext } from "@/contexts/AuthContext"
import { apiClient } from "@/lib/api"

/**
 * Desactivar o eliminar la cuenta propia.
 *
 * Antes esta pantalla era solo maqueta: el botón no hacía nada y no existía
 * el endpoint. Desactivar es reversible durante 30 días (basta con volver a
 * iniciar sesión); eliminar es definitivo y se confirma escribiendo el correo,
 * lo que también sirve a quien entró con Google y no tiene contraseña.
 */
export function BorrarCuenta() {
  const { t } = useTranslation()
  const { user } = useAuthContext()
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState<"deactivate" | "delete" | null>(null)
  const [error, setError] = useState("")

  const emailMatches = !!user?.email && email.trim().toLowerCase() === user.email.toLowerCase()

  // Recarga completa: la API ya borró las cookies y así no queda estado de
  // sesión en memoria. AccountNotice muestra el aviso en la página de inicio.
  const leave = (result: "desactivada" | "eliminada") => {
    try { localStorage.setItem("auth_event", Date.now().toString()) } catch { /* sin almacenamiento */ }
    window.location.href = `/?cuenta=${result}`
  }

  const deactivate = async () => {
    setBusy("deactivate"); setError("")
    try {
      await apiClient("/api/v1/me/deactivate/", { method: "POST" })
      leave("desactivada")
    } catch (e) {
      setError(e instanceof Error ? e.message : t("account.error"))
      setBusy(null)
    }
  }

  const remove = async () => {
    setBusy("delete"); setError("")
    try {
      await apiClient("/api/v1/me/delete-account/", { method: "POST", body: { confirm_email: email.trim() } })
      leave("eliminada")
    } catch (e) {
      setError(e instanceof Error ? e.message : t("account.error"))
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <PauseCircle className="h-5 w-5 text-amber-500" />
            {t("account.deactivateTitle")}
          </CardTitle>
          <CardDescription className="text-sm md:text-base">{t("account.deactivateBody")}</CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap gap-2">
          {!confirmDeactivate ? (
            <Button variant="outline" onClick={() => setConfirmDeactivate(true)}>{t("account.deactivateButton")}</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setConfirmDeactivate(false)} disabled={busy !== null}>{t("account.cancel")}</Button>
              <Button className="bg-amber-500 hover:bg-amber-600" onClick={deactivate} disabled={busy !== null}>
                {busy === "deactivate" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("account.deactivateConfirm")}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <Card className="w-full border-red-100">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            {t("ui.deleteAccountTitle")}
          </CardTitle>
          <CardDescription className="text-sm md:text-base">{t("account.deleteBody")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="confirm-email">{t("account.deleteConfirmPrompt")}</Label>
            <Input
              id="confirm-email"
              type="email"
              autoComplete="off"
              placeholder={user?.email ?? ""}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button variant="destructive" className="w-full sm:w-auto" onClick={remove} disabled={!emailMatches || busy !== null}>
            {busy === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("ui.deleteAccountButton")}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
