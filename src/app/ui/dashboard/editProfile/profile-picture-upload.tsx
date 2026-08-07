"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { CropImageModal } from "@/components/CropImageModal";

interface UserMe {
  id: string;
  /** El paciente no tiene borrador de perfil: su foto sale de acá. */
  profile_picture?: string | null;
}

interface ProfileDraft {
  profile_picture?: string | null;
}

export function ProfilePictureUpload() {
  const { notifyProfileChanged } = useAuthContext();
  const [userId, setUserId] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
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
      setMsg({ type: "success", text: "Foto de perfil actualizada." });
      notifyProfileChanged();
    } catch (e) {
      setMsg({ type: "error", text: e instanceof Error ? e.message : "Error al subir la foto." });
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

      <div className="flex flex-col items-center gap-3 py-6">
        <div className="relative group cursor-pointer" onClick={() => inputRef.current?.click()}>
          <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-blue-100 bg-gray-100 flex items-center justify-center">
            {preview ? (
              <Image
                src={preview}
                alt="Foto de perfil"
                width={112}
                height={112}
                className="object-cover w-full h-full"
              />
            ) : (
              <Camera className="h-10 w-10 text-gray-400" />
            )}
          </div>
          <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            {uploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={uploading}
        />

        <button
          type="button"
          className="text-xs text-blue-600 underline hover:text-blue-800 disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || !userId}
        >
          {uploading ? "Subiendo..." : "Cambiar foto de perfil"}
        </button>

        {msg && (
          <p className={`text-xs ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {msg.text}
          </p>
        )}
      </div>
    </>
  );
}
