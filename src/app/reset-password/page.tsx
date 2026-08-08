import { Suspense } from "react";
import { ResetPasswordForm } from "@/app/ui/auth/reset-password-form";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  return (
    <Suspense fallback={<div className="pt-16 text-center text-gray-500">{t("ui.loading")}</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
