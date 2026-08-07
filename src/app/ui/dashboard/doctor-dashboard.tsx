"use client";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  FiEdit2,
  FiChevronRight,
  FiHeart,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { CropImageModal } from "@/components/CropImageModal";
import { VerificationStatusCard } from "./VerificationStatusCard";
import { VerificationActionsCard } from "./VerificationActionsCard";
import { AppointmentsList } from "./AppointmentsList";
import { useAuthContext } from "@/contexts/AuthContext";

// Tipo para la información del usuario
interface UserData {
  name: string;
  lastname: string;
  phone_number: string;
  email: string;
  address?: string;
  profile_picture?: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
}

export default function DoctorDashboard() {
  const { profileVersion, notifyProfileChanged } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const fetchUserData = async () => {
    try {
      const [userRes, draftRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me/`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/profile-draft/`, { credentials: "include" }),
      ]);

      if (!userRes.ok) {
        throw new Error("No se pudo obtener la información del usuario");
      }

      const user = await userRes.json();
      const draft = draftRes.ok ? await draftRes.json() : {};
      setUserId(user.id);
      // Sin cache-buster: el backend ya la devuelve prefirmada y cualquier
      // parámetro extra rompe la firma SigV4. Ver scripts/presigned-urls.test.mjs.
      const pic = draft.profile_picture ?? null;
      setUserData({ ...user, profile_picture: pic });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setErrorMessage("Error al cargar los datos del usuario");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  // Se vuelve a pedir en cada cambio de perfil. La fuente es AuthContext, así
  // que no hay props que cablear ni contadores locales que mantener.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileVersion]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropSrc(URL.createObjectURL(file));
    e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!userId) return;
    setCropSrc(null);
    setUploading(true);
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
      // Sin cache-buster: la firma SigV4 de la URL prefirmada cubre el query
      // string, así que cualquier parámetro extra la rompe con 403. Cada subida
      // ya genera una clave nueva con UUID, así que no hay nada que invalidar.
      setUserData((prev) => prev ? { ...prev, profile_picture: data.profile_picture_url } : prev);
      // La foto suma al porcentaje del perfil.
      notifyProfileChanged();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Error al subir la foto. Inténtalo de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );

      if (response.ok) {
        alert("Sesión cerrada con éxito");
        window.location.href = "/login";
      } else {
        const data = await response.json();
        setErrorMessage(data.message || "Error al cerrar sesión");
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Error de red. Inténtalo de nuevo.");
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-8 lg:px-28 xl:px-16 pb-12 max-w-7xl">
      {cropSrc && (
        <CropImageModal
          imageSrc={cropSrc}
          onConfirm={handleCropConfirm}
          onCancel={() => setCropSrc(null)}
        />
      )}
      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : (
        <>
          <Breadcrumb className="pb-5 pt-2 font-medium">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Perfil</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="w-full mb-4">
            <VerificationStatusCard collapsible />
            <VerificationActionsCard
              emailVerified={userData?.is_email_verified ?? false}
              phoneVerified={userData?.is_phone_verified ?? false}
            />
          </div>

          <div className="grid md:grid-cols-[300px,1fr] gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-lg drop-shadow-lg p-6">
                <div className="relative mb-4">
                  {userData?.profile_picture ? (
                    <Image
                      src={userData.profile_picture}
                      alt="Profile"
                      width={128}
                      height={128}
                      className="w-32 h-32 rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full mx-auto bg-blue-100 flex items-center justify-center text-blue-500 text-3xl font-semibold">
                      {userData?.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-0 right-1/4 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-60"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FiEdit2 className="w-4 h-4" />}
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-semibold">
                    {[userData?.name, userData?.lastname].filter(Boolean).join(" ")}
                  </h2>
                  <p className="text-gray-500">{userData?.phone_number}</p>
                  <p className="text-gray-500">{userData?.email}</p>
                  <p className="text-gray-500">adress here #45-98</p>
                </div>
              </div>
              <div className="space-y-2 bg-white rounded-lg drop-shadow-lg p-2">
                {[
                  { icon: FiEdit2, 
                    text: "Editar Perfil", 
                    path: "/edit-profile",
                    onClick: () => {
                      window.location.href = "/dashboard/edit-doctor-profile";
                    } 
                  },
                  { icon: FiSettings, 
                    text: "Configuración",
                    path: "/settings",
                    onClick: () => {
                      window.location.href = "/dashboard/settings";
                    } 
                  },
                  { icon: FiHelpCircle, text: "Ayuda y Soporte" },
                  { icon: FiShield, text: "Terminos y Condiciones" },
                  {
                    icon: FiLogOut,
                    text: "Salir",
                    className: "text-red-500",
                    onClick: handleLogout,
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex cursor-pointer justify-between items-center p-2 rounded hover:bg-gray-100 ${
                      item.className || ""
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-2 h-4 w-4" />
                      {item.text}
                    </div>
                    <FiChevronRight className="h-4 w-4" />
                  </div>
                ))}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Favoritos</h3>
                <div className="bg-white rounded-lg drop-shadow-lg p-4">
                  <div className="flex items-center">
                    <Image
                      src="https://fesamedcare.s3.us-east-2.amazonaws.com/doctorsimages/michael.png"
                      alt="Dr. Michael Biancha"
                      width={64}
                      height={64}
                      className="w-16 h-16 rounded-full mr-4"
                    />
                    <div>
                      <h4 className="font-semibold">Dr. Michael Biancha</h4>
                      <p className="text-sm text-gray-500">Otorrino</p>
                      <p className="text-sm text-gray-500">CORL Cali</p>
                      <div className="flex items-center">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm ml-1">4.7</span>
                        <span className="text-sm text-gray-500 ml-1">
                          (5,223 Reviews)
                        </span>
                      </div>
                    </div>
                    <FiHeart className="ml-auto text-red-500" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">Mis consultas</h2>
              <AppointmentsList role="doctor" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
