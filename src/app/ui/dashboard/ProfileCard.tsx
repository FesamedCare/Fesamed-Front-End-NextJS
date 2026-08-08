"use client";

import { useRef } from "react";
import { Loader2, Mail, Phone, Camera } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useTranslation } from "@/i18n/LocaleProvider";

interface Props {
  name?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  pictureUrl?: string | null;
  /** Sólo si se pasa aparece el botón de cambiar foto. Sin handler no hay botón. */
  onPickPhoto?: (file: File) => void;
  uploading?: boolean;
}

export function ProfileCard({
  name,
  lastname,
  email,
  phone,
  pictureUrl,
  onPickPhoto,
  uploading = false,
}: Props) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const fullName = [name, lastname].filter(Boolean).join(" ");

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/*
        Banda con degradado: separa la identidad de los datos de contacto sin
        una línea divisoria, y repite el azul del estado vacío de las citas para
        que las dos piezas se lean del mismo sistema.
      */}
      <div className="relative h-24 bg-gradient-to-b from-blue-100 to-blue-50/40" />

      <div className="px-6 pb-6">
        {/* El avatar monta sobre la banda: el anillo blanco lo despega del fondo */}
        <div className="relative -mt-14 mb-4 flex justify-center">
          <div className="relative">
            <div className="h-28 w-28 overflow-hidden rounded-full ring-4 ring-white shadow-sm">
              <UserAvatar
                src={pictureUrl ?? undefined}
                name={name}
                lastname={lastname}
                width={112}
                height={112}
                className="h-28 w-28 object-cover"
              />
            </div>

            {onPickPhoto && (
              <>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  aria-label={t("ui.profilePhoto")}
                  className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-blue-500 text-white ring-4 ring-white transition-colors hover:bg-blue-600 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) onPickPhoto(file);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>
        </div>

        <h2 className="text-center text-lg font-semibold text-gray-900">
          {fullName}
        </h2>

        {/*
          Antes teléfono y correo eran dos líneas grises idénticas y no se
          distinguía cuál era cuál de un vistazo. Con icono, cada dato se
          identifica sin leerlo.
        */}
        {(phone || email) && (
          <dl className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            {phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <dt className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <Phone className="h-3.5 w-3.5" />
                  <span className="sr-only">{t("ui.srPhone")}</span>
                </dt>
                <dd className="truncate text-gray-600">{phone}</dd>
              </div>
            )}
            {email && (
              <div className="flex items-center gap-2.5 text-sm">
                <dt className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="sr-only">{t("ui.srEmail")}</span>
                </dt>
                <dd className="truncate text-gray-600" title={email}>
                  {email}
                </dd>
              </div>
            )}
          </dl>
        )}
      </div>
    </div>
  );
}
