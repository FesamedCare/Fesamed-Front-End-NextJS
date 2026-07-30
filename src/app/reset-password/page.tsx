import { Suspense } from "react";
import { ResetPasswordForm } from "@/app/ui/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="pt-16 text-center text-gray-500">Cargando...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
