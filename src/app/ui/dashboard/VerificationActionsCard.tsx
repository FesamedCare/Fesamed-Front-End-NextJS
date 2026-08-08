"use client";

import { useState } from "react";
import { Mail, Phone, CheckCircle2, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/LocaleProvider";

export function VerificationActionsCard() {
  const { t } = useTranslation();
  // Estado y aviso salen los dos del contexto, que es la fuente única.
  // Antes llegaban por props que cada pantalla cableaba a mano, y eso ya causó
  // dos bugs: el porcentaje que no se refrescaba al verificar, y una página que
  // pasaba `false` fijo y mostraba todo como sin verificar.
  const { user, notifyProfileChanged } = useAuthContext();
  const emailVerified = Boolean(user?.is_email_verified);
  const phoneVerified = Boolean(user?.is_phone_verified);
  // Email state
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMsg, setEmailMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Phone state
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneMsg, setPhoneMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (emailVerified && phoneVerified) return null;

  async function handleResendEmail() {
    setEmailLoading(true);
    setEmailMsg(null);
    try {
      await apiClient("/api/v1/resend-verification-email/", { method: "POST" });
      setEmailMsg({ type: "success", text: t("verification.emailSent") });
    } catch (e) {
      setEmailMsg({ type: "error", text: e instanceof Error ? e.message : t("verification.emailError") });
    } finally {
      setEmailLoading(false);
    }
  }

  async function handleSendOtp() {
    if (!phone.trim()) {
      setPhoneMsg({ type: "error", text: t("verification.enterPhone") });
      return;
    }
    setPhoneLoading(true);
    setPhoneMsg(null);
    try {
      await apiClient("/api/v1/send-otp", { method: "POST", body: { phone_number: phone.trim() } });
      setOtpSent(true);
      setPhoneMsg({ type: "success", text: t("verification.codeSent") });
    } catch (e) {
      setPhoneMsg({ type: "error", text: e instanceof Error ? e.message : t("verification.codeError") });
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otpCode.trim()) {
      setPhoneMsg({ type: "error", text: t("verification.enterCode") });
      return;
    }
    setPhoneLoading(true);
    setPhoneMsg(null);
    try {
      const res = await apiClient<{ ok: boolean }>("/api/v1/check", {
        method: "POST",
        body: { phone_number: phone.trim(), code: otpCode.trim() },
      });
      if (res.ok) {
        setPhoneMsg({ type: "success", text: t("verification.phoneVerified") });
        notifyProfileChanged();
      } else {
        setPhoneMsg({ type: "error", text: t("verification.codeIncorrect") });
      }
    } catch (e) {
      setPhoneMsg({ type: "error", text: e instanceof Error ? e.message : t("verification.verifyCodeError") });
    } finally {
      setPhoneLoading(false);
    }
  }

  return (
    <Card className="border-blue-100 shadow-none mb-4">
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm font-semibold text-gray-700">{t("misc.accountVerification")}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-5">

        {/* Email */}
        {!emailVerified && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Mail className="h-4 w-4 text-blue-500 shrink-0" />
              {t("verification.email")}
            </div>
            <p className="text-xs text-muted-foreground">
              {t("misc.emailLinkHint")}{" "}
              <span className="font-mono">localhost:8025</span> (MailHog).
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-fit"
              onClick={handleResendEmail}
              disabled={emailLoading}
            >
              {emailLoading ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />{t("ui.sending")}</>
              ) : (
                t("verification.resendVerification")
              )}
            </Button>
            {emailMsg && (
              <p className={`text-xs ${emailMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {emailMsg.text}
              </p>
            )}
          </div>
        )}

        {/* Separator */}
        {!emailVerified && !phoneVerified && <hr className="border-gray-100" />}

        {/* Phone */}
        {!phoneVerified && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Phone className="h-4 w-4 text-blue-500 shrink-0" />
              {t("verification.phone")}
            </div>
            {!otpSent ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {t("misc.phoneCountryHint")} <span className="font-mono">+573001234567</span>).
                  {t("verification.phoneHint")}
                </p>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder={t("verification.phonePlaceholder")}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="max-w-[220px] h-8 text-sm"
                  />
                  <Button size="sm" variant="outline" onClick={handleSendOtp} disabled={phoneLoading}>
                    {phoneLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("misc.sendCode")}
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  {t("verification.codeHint")}
                </p>
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder={t("verification.codePlaceholder")}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    maxLength={6}
                    className="max-w-[140px] h-8 text-sm font-mono tracking-widest"
                  />
                  <Button size="sm" variant="outline" onClick={handleVerifyOtp} disabled={phoneLoading}>
                    {phoneLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verificar"}
                  </Button>
                  <button
                    className="text-xs text-blue-600 underline hover:text-blue-800"
                    onClick={() => { setOtpSent(false); setOtpCode(""); setPhoneMsg(null); }}
                  >
                    {t("verification.changeNumber")}
                  </button>
                </div>
              </>
            )}
            {phoneMsg && (
              <p className={`text-xs flex items-center gap-1 ${phoneMsg.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {phoneMsg.type === "success" && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />}
                {phoneMsg.text}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
