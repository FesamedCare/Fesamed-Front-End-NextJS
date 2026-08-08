"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImagePreviewModal from "./image-preview-modal";
import { apiClient } from "@/lib/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { CropImageModal } from "@/components/CropImageModal";
import { useTranslation } from "@/i18n/LocaleProvider";

interface UserMe {
  id: string;
  /** El paciente no tiene borrador de perfil: su foto sale de acá. */
  profile_picture?: string | null;
}

interface ProfileDraft {
  profile_picture?: string | null;
}

export function ProfilePictureUpload() {
  const { t } = useTranslation();
  const { notifyProfileChanged } = useAuthContext();
  const [userId, setUserId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [viewing, setViewing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // El borrador de perfil es solo de doctores: para un paciente devuelve 403.
    // Se pide aparte y tolerando el fallo, porque antes iba en un Promise.all y
    // ese 403 tumbaba también la carga del usuario, dejando el botón de subir
    // deshabilitado para siempre.
    async function cargar() {
      try {
        const user = await apiClient<UserMe>("/api/v1/user/me/");
        setUserId(user.id);

        const draft = await apiClient<ProfileDraft>("/api/v1/me/profile-draft/").catch(() => null);

        // Sin cache-buster: ya viene prefirmada del backend.
        // El doctor ve la del borrador, que es la que está editando; el
        // paciente no tiene borrador y ve la suya.
        setPreview(draft?.profile_picture ?? user.profile_picture ?? null);
      } catch {
        // apiClient ya redirige al login si la sesión expiró.
      }
    }
    cargar();
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    if (!userId) return;
    setCropSrc(null);
    setUploading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append("file", blob, "profile.jpg");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/${userId}/profile-picture/`,
        { method: "POST", body: formData, credentials: "include" }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail ?? `Error ${res.status}`);
      }
      const data = await res.json();
      // Sin cache-buster: la URL viene prefirmada por S3 y la firma SigV4 cubre
      // el query string completo. Agregarle cualquier parámetro, con ? o con &,
      // la invalida y el navegador recibe 403 SignatureDoesNotMatch.
      // No hace falta: cada subida genera una clave nueva con un UUID distinto.
      setPreview(data.profile_picture_url);
      setMsg({ type: "success", text: t("ui.photoUpdated") });
      notifyProfileChanged();
    } catch (e) {
      setMsg({ type: "error", text: e instanceof Error ? e.message : t("ui.photoUploadError") });
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      {cropSrc && (
        <CropImageModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => { setCropSrc(null); }}
        />
      )}

      {/*
        Ver y cambiar son dos intenciones distintas y antes compartían el mismo
        gesto: cualquier clic en la foto abría el selector de archivos, así que
        no había forma de mirar la que ya estabas usando.
        Ahora el clic en la foto la abre en grande, y cambiarla es un botón
        aparte (también disponible dentro de la vista ampliada).
      */}
      {preview && (
        <ImagePreviewModal
          images={[{ src: preview, name: t("ui.profilePhoto") }]}
          compact
          open={viewing}
          onOpenChange={setViewing}
          footerAction={
            <Button
              size="sm"
              className="rounded-full"
              onClick={() => {
                setViewing(false);
                inputRef.current?.click();
              }}
            >
              <Camera className="mr-2 h-4 w-4" />
              {t("ui.changePhoto")}
            </Button>
          }
        />
      )}

      <div className="flex flex-col items-center gap-3 py-6">
        <button
          type="button"
          onClick={() => (preview ? setViewing(true) : inputRef.current?.click())}
          aria-label={preview ? t("ui.viewPhoto") : t("ui.changeProfilePhoto")}
          className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-4 ring-white shadow-sm">
            {preview ? (
              <Image
                src={preview}
                alt={t("ui.profilePhoto")}
                width={112}
                height={112}
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : preview ? (
              <Eye className="h-6 w-6 text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        <div className="flex flex-wrap items-center justify-center gap-2">
          {preview && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setViewing(true)}
            >
              <Eye className="mr-1.5 h-3.5 w-3.5" />
              {t("ui.viewPhoto")}
            </Button>
          )}
          <Button
            type="button"
            variant={preview ? "outline" : "default"}
            size="sm"
            className="rounded-full"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || !userId}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                {t("ui.uploadingPhoto")}
              </>
            ) : (
              <>
                <Camera className="mr-1.5 h-3.5 w-3.5" />
                {preview ? t("ui.changePhoto") : t("ui.changeProfilePhoto")}
              </>
            )}
          </Button>
        </div>

        {!preview && (
          <p className="text-xs text-gray-400">{t("ui.noPhotoYet")}</p>
        )}

        {msg && (
          <p className={`text-xs ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </>
  );
}
