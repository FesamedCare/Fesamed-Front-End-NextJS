'use client';

import Link from "next/link";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { useTranslation } from "@/i18n/LocaleProvider";

export function ForgotPasswordForm() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [sentMessage, setSentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setSentMessage('');
    setIsLoading(true);

    try {
      // El backend responde lo mismo exista la cuenta o no. Se muestra su
      // mensaje tal cual: inventar uno acá arriesgaría filtrar la diferencia.
      const res = await apiClient<{ message: string }>('/api/v1/forgot-password/', {
        method: 'POST',
        body: { email },
      });
      setSentMessage(res.message);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo enviar el correo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-16">
      <section className="bg-white">
        <div className="flex flex-col items-center px-6 py-8 mx-auto lg:py-10 lg:pb-28">
          <div className="w-full md:mt-0 sm:max-w-md xl:p-0">
            <div className="p-6 sm:p-8">
              <h1 className="text-xl text-center font-bold leading-tight tracking-tight text-gray-900 md:text-2xl">
                {t("auth.forgotTitle")}
              </h1>
              <p className="text-gray-500 text-center mb-6">
                {t("auth.forgotSubtitle")}
              </p>
              <div className="flex flex-col items-center">
                {sentMessage ? (
                  <div className="w-80 flex flex-col gap-6">
                    <p className="text-sm text-gray-700">{sentMessage}</p>
                    <p className="text-sm font-light text-gray-500">
                      Revisa tu bandeja de entrada.{" "}
                      <Link href="/login" className="font-medium text-blue-500 hover:underline">
                        {t("auth.backToSignIn")}
                      </Link>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={onSubmit} className="flex flex-col gap-6 w-80">
                    <div>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5"
                        placeholder={t("auth.emailPlaceholder")}
                        required
                        disabled={isLoading}
                      />
                    </div>
                    {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}
                    <button
                      type="submit"
                      className="w-full text-white bg-blue-950 hover:bg-primary-700 focus:ring-2 focus:outline-none focus:ring-blue-300 focus:text-blue-500 focus:bg-white font-medium rounded-full text-lg px-5 py-1.5 text-center disabled:opacity-70"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Enviando...' : 'Enviar enlace'}
                    </button>
                    <p className="text-sm font-light text-gray-500">
                      {t("misc.rememberedIt")}{" "}
                      <Link href="/login" className="font-medium text-blue-500 hover:underline">
                        {t("auth.signIn")}
                      </Link>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
