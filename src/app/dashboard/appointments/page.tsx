"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { AppointmentsList } from "@/app/ui/dashboard/AppointmentsList";
import Footer from "@/app/ui/navigation/footer";

export default function AppointmentsPage() {
  const [role, setRole] = useState<"patient" | "doctor" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/me/`,
          { credentials: "include" }
        );
        if (!res.ok) return;
        const data = await res.json();
        const roleName: string =
          data.role?.name?.toLowerCase() ?? data.role?.toLowerCase() ?? "";
        if (roleName === "patient") setRole("patient");
        else if (roleName === "doctor") setRole("doctor");
      } catch {
        // handled below
      } finally {
        setLoading(false);
      }
    };
    fetchRole();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!role) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">
          No se pudo cargar tu información. Por favor inicia sesión.
        </p>
        <Link href="/login" className="text-blue-500 underline">
          Ir al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 md:px-8 xl:px-16 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mis citas</h1>
          <Link
            href="/dashboard"
            className="text-sm text-blue-500 hover:underline"
          >
            ← Volver al perfil
          </Link>
        </div>
        <AppointmentsList role={role} />
      </div>
      <Footer />
    </div>
  );
}
