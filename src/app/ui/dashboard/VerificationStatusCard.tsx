"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { get } from "@/lib/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const STORAGE_KEY = "doctor-verification-banner-collapsed";

export interface VerificationMissingItem {
  key: string;
  label: string;
}

export interface VerificationStatus {
  completion_percentage: number;
  status: string;
  missing: VerificationMissingItem[];
  is_profile_approved?: boolean;
}

export interface VerificationStatusCardProps {
  /** Si es true, el aviso se puede contraer/expandir y ocupa todo el ancho. Para dashboard. */
  collapsible?: boolean;
}

export function VerificationStatusCard({ collapsible = false }: VerificationStatusCardProps) {
  // Se relee sola en cada cambio de perfil. Antes dependía de una prop
  // refreshTrigger que cada pantalla tenía que acordarse de pasar, y las que se
  // olvidaban mostraban el porcentaje viejo hasta recargar la página.
  const { profileVersion } = useAuthContext();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!collapsible || typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCollapsed(stored === "1");
    } catch {
      // ignore
    }
  }, [collapsible]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    get<VerificationStatus>("/api/v1/me/profile-draft/verification-status/")
      .then((data) => {
        if (!cancelled) setStatus(data);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar");
          setStatus(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileVersion]);

  if (loading) {
    const loadingCard = (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          <span className="text-sm text-amber-800">Cargando estado de verificación…</span>
        </CardContent>
      </Card>
    );
    return collapsible ? <div className="w-full mb-4">{loadingCard}</div> : loadingCard;
  }

  if (error || !status) {
    return null;
  }

  const { completion_percentage, status: verifyStatus, missing, is_profile_approved } = status;
  const draftStatus = String(verifyStatus).toUpperCase();
  const isUnderReview = draftStatus === "UNDER_REVIEW" && !is_profile_approved;
  const hasPendingChanges = draftStatus === "UNDER_REVIEW" && is_profile_approved === true;
  const isApproved = is_profile_approved === true && draftStatus !== "UNDER_REVIEW" && draftStatus !== "REJECTED";
  const isRejected = draftStatus === "REJECTED";

  const summary =
    hasPendingChanges
      ? "Cambios pendientes de aprobación"
      : isApproved
        ? "Perfil verificado"
        : isUnderReview
          ? "Perfil en revisión"
          : isRejected
            ? "Perfil rechazado"
            : `Completa tu perfil para verificación (${completion_percentage}%)`;

  const collapsedBarClass =
    hasPendingChanges
      ? "border-amber-200 bg-amber-50/50 text-amber-800"
      : isApproved
        ? "border-green-200 bg-green-50/50 text-green-800"
        : isUnderReview
          ? "border-blue-200 bg-blue-50/50 text-blue-800"
          : isRejected
            ? "border-red-200 bg-red-50/50 text-red-800"
            : "border-amber-200 bg-amber-50/50 text-amber-800";

  if (collapsible && collapsed) {
    return (
      <div className="w-full mb-4">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`w-full flex items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-left text-sm font-medium transition-colors hover:opacity-90 ${collapsedBarClass}`}
          aria-expanded="false"
        >
          <span className="inline-flex items-center gap-2">
            {isApproved ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {summary}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      </div>
    );
  }

  const collapseButton = collapsible ? (
    <button
      type="button"
      onClick={toggleCollapsed}
      className="shrink-0 rounded p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"
      aria-label="Contraer aviso"
    >
      <ChevronUp className="h-4 w-4" />
    </button>
  ) : null;

  const wrap = (card: ReactNode): ReactNode =>
    collapsible ? (
      <div className="w-full mb-4 flex items-start gap-2">
        <div className="min-w-0 flex-1">{card}</div>
        {collapseButton}
      </div>
    ) : (
      card
    );

  if (hasPendingChanges) {
    return wrap(
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Cambios pendientes de aprobación</p>
              <p className="text-amber-700 mt-1">
                Realizaste cambios en tu perfil y están siendo revisados por el equipo de Fesamed.
                Tu perfil aprobado anterior sigue visible para los pacientes mientras tanto.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100">
                <Link href="/dashboard/edit-doctor-profile">Ver mis cambios</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isApproved) {
    return wrap(
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div className="text-sm text-green-800">
            <p className="font-medium">Perfil verificado</p>
            <p className="text-green-700">Tu perfil está aprobado y visible en la búsqueda de doctores.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isUnderReview) {
    return wrap(
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Perfil en revisión</p>
              <p className="text-blue-700 mt-1">
                Tu perfil ya alcanzó el 100% y está en cola de revisión. Un administrador de Fesamed lo revisará pronto;
                cuando lo aprueben, aparecerás en la búsqueda de doctores.
              </p>
              <p className="text-blue-600 mt-2 text-xs">
                La revisión se hace en el panel de administración de Fesamed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isRejected) {
    return wrap(
      <Card className="border-red-200 bg-red-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Perfil rechazado</p>
              <p className="text-red-700 mt-1">
                Revisa tu correo y los comentarios del revisor. Corrige lo indicado y guarda de nuevo para volver a enviar.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/dashboard/edit-doctor-profile">Editar perfil</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return wrap(
    <Card className="border-amber-200 bg-amber-50/50 shadow-none">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-amber-900">Completa tu perfil para solicitar verificación</p>
            <p className="text-amber-800 text-sm mt-1">
              Para aparecer en la búsqueda de doctores, tu perfil debe estar al 100%. Cuando lo completes,
              se enviará a revisión y un administrador lo aprobará desde el panel de Fesamed.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 rounded-full bg-amber-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-600 transition-all"
                  style={{ width: `${Math.min(100, completion_percentage)}%` }}
                />
              </div>
              <span className="text-sm font-medium text-amber-900 whitespace-nowrap">{completion_percentage}%</span>
            </div>
            {missing.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-medium text-amber-800 mb-1">Te falta:</p>
                <ul className="text-sm text-amber-800 space-y-0.5 list-disc list-inside">
                  {missing.map((item) => (
                    <li key={item.key}>{item.label}</li>
                  ))}
                </ul>
                <Button asChild size="sm" className="mt-3 bg-amber-600 hover:bg-amber-700">
                  <Link href="/dashboard/edit-doctor-profile" className="inline-flex items-center gap-1">
                    Ir a editar perfil <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
