"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) return null;

  const role = (user as { role?: { name?: string } | string })?.role;
  const roleName = typeof role === "string" ? role : (role as { name?: string })?.name;

  if (roleName !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
        <ShieldAlert className="h-12 w-12 text-red-500" />
        <h1 className="text-xl font-semibold text-gray-800">Acceso denegado</h1>
        <p className="text-gray-500 text-sm">No tienes permisos para acceder al panel de administración.</p>
        <Link href="/dashboard" className="text-blue-600 underline text-sm">Ir al dashboard</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-8 sm:px-20 xl:px-24 2xl:px-40 py-3 flex items-center gap-6">
        <Link href="/admin/review-queue" className="text-sm font-semibold text-blue-700 hover:underline">
          Panel de Administración
        </Link>
        <span className="text-gray-300">|</span>
        <Link href="/admin/review-queue" className="text-sm text-gray-600 hover:text-blue-600">
          Cola de revisión
        </Link>
      </div>
      <div className="px-8 sm:px-20 xl:px-24 2xl:px-40 py-8">
        {children}
      </div>
    </div>
  );
}
