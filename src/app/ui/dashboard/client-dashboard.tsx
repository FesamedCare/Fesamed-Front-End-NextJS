"use client";
import {
  FiCalendar,
  FiEdit2,
  FiHelpCircle,
  FiLogOut,
  FiSettings,
  FiShield,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import { AppointmentsList } from "./AppointmentsList";
import { ProfileCard } from "./ProfileCard";
import { DashboardBreadcrumb } from "./DashboardBreadcrumb";
import { DashboardMenu } from "./DashboardMenu";
import { VerificationActionsCard } from "./VerificationActionsCard";
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

export default function ClientDashboard() {
  const { t } = useTranslation();
  const { profileVersion } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState("");
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me/`,
        { credentials: "include" }
      );

      if (!response.ok) {
        throw new Error(t("dashboard.loadUserError"));
      }

      const data = await response.json();
      setUserData(data);
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
      <DashboardBreadcrumb />

      {userData && (
        <VerificationActionsCard />
      )}

      <div className="grid md:grid-cols-[300px,1fr] gap-8">
        <div className="space-y-6">
          <ProfileCard
            name={userData?.name}
            lastname={userData?.lastname}
            email={userData?.email}
            phone={userData?.phone_number}
            pictureUrl={userData?.profile_picture}
          />
          <DashboardMenu
            items={[
              { icon: FiEdit2, label: t("dashboard.editProfile"), href: "/dashboard/edit-patient-profile" },
              { icon: FiCalendar, label: t("dashboard.myAppointments"), href: "/dashboard/appointments" },
              { icon: FiSettings, label: t("dashboard.settings"), href: "/dashboard/settings" },
              { icon: FiHelpCircle, label: t("dashboard.help") },
              { icon: FiShield, label: t("dashboard.terms") },
              { icon: FiLogOut, label: t("dashboard.logout"), onClick: handleLogout, tone: "danger" },
            ]}
          />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">{t("dashboard.myAppointments")}</h2>
          <AppointmentsList role="patient" />
        </div>
      </div>
    </div>
  );
}
