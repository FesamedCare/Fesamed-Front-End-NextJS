'use client';

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";

// Mismas reglas que valida el backend en
// src/app/api/v1/auth/password_policy.py. Si cambian allá, cambian acá.
// Las etiquetas dependen del idioma, así que la lista se arma dentro del
// componente en vez de vivir a nivel de módulo.
function construirReglas(t: (k: TranslationKey) => string) {
  return [
    { etiqueta: t('register.ruleMinLength'), ok: (v: string) => v.length >= 8 },
    { etiqueta: t('profile.ruleUppercase'), ok: (v: string) => /[A-Z]/.test(v) },
    { etiqueta: t('profile.ruleLowercase'), ok: (v: string) => /[a-z]/.test(v) },
    { etiqueta: t('profile.ruleNumber'), ok: (v: string) => /[0-9]/.test(v) },
    { etiqueta: t('profile.ruleSpecial'), ok: (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v) },
  ];
}

export function ResetPasswordForm() {
  const { t } = useTranslation();
  const REGLAS = construirReglas(t);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const cumpleTodo = REGLAS.every((r) => r.ok(password));
  const coinciden = password.length > 0 && password === confirm;

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await apiClient('/api/v1/reset-password/', {
        method: 'POST',
        body: { token, new_password: password, new_password_confirm: confirm },
      });
      router.push('/login');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t("profile.passwordChangeError"));
    } finally {
      setIsLoading(false);
    }
  };

  // Sin token no hay nada que hacer: se avisa sin llamar a la API.
  if (!token) {
    return (
      <div className="pt-16">
        <section className="bg-white">
          <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
            <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
              <div className="p-6 sm:p-8 text-center">
                <h1 className="text-xl font-bold text-gray-900 md:text-2xl mb-4">
                  {t("auth.resetIncompleteTitle")}
                </h1>
                <p className="text-gray-500 mb-6">
                  {t("auth.resetIncompleteBody")}
                </p>
                <Link href="/forgot-password" className="font-medium text-blue-500 hover:underline">
                  {t("auth.resetRequestAnother")}
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <section className="bg-white">
        <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
          <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 sm:p-8">
              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                {t("auth.resetTitle")}
              </h1>
              <p className="text-gray-500 text-center mb-6">
                {t("auth.resetSubtitle")}
              </p>
              <div className="flex flex-col items-center">
                <form onSubmit={onSubmit} className="flex flex-col gap-6 w-80">
                  <div>
                    <input
                      type="password"
                      name="new_password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                      placeholder={t("auth.newPasswordPlaceholder")}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      name="new_password_confirm"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                      placeholder={t("auth.repeatPasswordPlaceholder")}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {password.length > 0 && (
                    <ul className="flex flex-col gap-1">
                      {REGLAS.map((regla) => (
                        <li
                          key={regla.etiqueta}
                          className={`text-xs ${regla.ok(password) ? 'text-green-600' : 'text-gray-400'}`}
                        >
                          {regla.ok(password) ? '✓' : '○'} {regla.etiqueta}
                        </li>
                      ))}
                      <li className={`text-xs ${coinciden ? 'text-green-600' : 'text-gray-400'}`}>
                        {coinciden ? '✓' : '○'} Las dos coinciden
                      </li>
                    </ul>
                  )}

                  {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

                  <button
                    type="submit"
                    className="w-full text-white bg-blue-950 hover:bg-primary-700 focus:ring-2 focus:outline-none focus:ring-blue-300 focus:text-blue-500 focus:bg-white font-medium rounded-full text-lg px-5 py-1.5 text-center disabled:opacity-70"
                    disabled={isLoading || !cumpleTodo || !coinciden}
                  >
                    {isLoading ? t("profile.saving") : t("profile.savePassword")}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
