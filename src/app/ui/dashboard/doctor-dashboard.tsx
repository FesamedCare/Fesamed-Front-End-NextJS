"use client";
import {
  FiCalendar,
  FiClock,
  FiEdit2,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { CropImageModal } from "@/components/CropImageModal";
import { VerificationStatusCard } from "./VerificationStatusCard";
import { VerificationActionsCard } from "./VerificationActionsCard";
import { AppointmentsList } from "./AppointmentsList";
import { ProfileCard } from "./ProfileCard";
import { DashboardBreadcrumb } from "./DashboardBreadcrumb";
import { DashboardMenu } from "./DashboardMenu";
import { useAuthContext } from "@/contexts/AuthContext";
import { useTranslation } from "@/i18n/LocaleProvider";

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
  const { t } = useTranslation();
  const { profileVersion, notifyProfileChanged } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      const [userRes, draftRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me/`, { credentials: "include" }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/me/profile-draft/`, { credentials: "include" }),
      ]);

      if (!userRes.ok) {
        throw new Error(t("dashboard.loadUserError"));
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
      setErrorMessage(t("dashboard.loadDataError"));
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

  const handlePickPhoto = (file: File) => {
    setCropSrc(URL.createObjectURL(file));
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
      setErrorMessage(e instanceof Error ? e.message : t("dashboard.uploadPhotoError"));
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
        alert(t("dashboard.logoutSuccess"));
        window.location.href = "/login";
      } else {
        const data = await response.json();
        setErrorMessage(data.message || t("dashboard.logoutError"));
      }
    } catch (error) {
      console.error(error);
      setErrorMessage(t("common.genericNetworkError"));
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
        <div className="text-center py-8">{t("ui.loading")}</div>
      ) : (
        <>
          <DashboardBreadcrumb />

          <div className="w-full mb-4">
            <VerificationStatusCard collapsible />
            <VerificationActionsCard />
          </div>

          <div className="grid md:grid-cols-[300px,1fr] gap-8">
            <div className="space-y-6">
              <ProfileCard
                name={userData?.name}
                lastname={userData?.lastname}
                email={userData?.email}
                phone={userData?.phone_number}
                pictureUrl={userData?.profile_picture}
                onPickPhoto={handlePickPhoto}
                uploading={uploading}
              />
              <DashboardMenu
                items={[
                  { icon: FiEdit2, label: t("dashboard.editProfile"), href: "/dashboard/edit-doctor-profile" },
                  { icon: FiClock, label: t("dashboard.availability"), href: "/dashboard/availability" },
                  { icon: FiCalendar, label: t("dashboard.myAppointments"), href: "/dashboard/appointments" },
                  { icon: FiSettings, label: t("dashboard.settings"), href: "/dashboard/settings" },
                  { icon: FiHelpCircle, label: t("dashboard.help") },
                  { icon: FiShield, label: t("dashboard.terms") },
                  { icon: FiLogOut, label: t("dashboard.logout"), onClick: handleLogout, tone: "danger" },
                ]}
              />
            </div>
            <div>
              <h2 className="text-xl font-semibold mb-4">{t("dashboard.myConsultations")}</h2>
              <AppointmentsList role="doctor" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
