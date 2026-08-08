'use client'
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ClientDashboard from "../ui/dashboard/client-dashboard";
import Footer from "../ui/navigation/footer";
import DoctorDashboard from "../ui/dashboard/doctor-dashboard";
import { useTranslation } from "@/i18n/LocaleProvider";

export default function Page() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me/`,
          { credentials: "include" }
        );

        if (!response.ok) throw new Error(t("dashboard.unauthorized"));

        const data = await response.json();
        const roleName = (data.role?.name ?? data.role ?? "").toLowerCase();

        if (roleName === "admin") {
          router.replace("/admin/review-queue");
          return;
        }

        setRole(roleName);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router, t]);

  if (isLoading) return null;

  return (
    <div>
      {role === "patient" && <ClientDashboard />}
      {role === "doctor" && <DoctorDashboard />}
      {!role && <p className="text-center text-red-500 p-4">{t("misc.dashboardLoadError")}</p>}
      <Footer />
    </div>
  );
}