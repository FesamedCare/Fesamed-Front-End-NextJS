"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, ChevronRight, ChevronDown, ChevronUp, X } from "lucide-react";
import { get } from "@/lib/api";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/i18n/LocaleProvider";

const STORAGE_KEY = "doctor-verification-banner-collapsed";
/**
 * Sólo se descarta el aviso "aprobado": es informativo y no hay nada que hacer
 * con él. Los otros estados piden una acción del doctor (completar, corregir,
 * esperar revisión), así que se pueden plegar pero no cerrar.
 *
 * Se guarda junto con el estado descartado: si el perfil vuelve a cambiar
 * —lo rechazan, manda cambios nuevos— el aviso reaparece solo.
 */
const DISMISS_KEY = "doctor-verification-banner-dismissed";

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
  const { t } = useTranslation();
  // Se relee sola en cada cambio de perfil. Antes dependía de una prop
  // refreshTrigger que cada pantalla tenía que acordarse de pasar, y las que se
  // olvidaban mostraban el porcentaje viejo hasta recargar la página.
  const { profileVersion } = useAuthContext();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!collapsible || typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setCollapsed(stored === "1");
    } catch {
      // ignore
    }
    try {
      setDismissedFor(localStorage.getItem(DISMISS_KEY));
    } catch {
      // ignore
    }
  }, [collapsible]);

  const dismiss = (forState: string) => {
    setDismissedFor(forState);
    try {
      localStorage.setItem(DISMISS_KEY, forState);
    } catch {
      // ignore
    }
  };

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
          setError(e instanceof Error ? e.message : t("verification.loadError"));
          setStatus(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [profileVersion, t]);

  if (loading) {
    const loadingCard = (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
          <span className="text-sm text-amber-800">{t("misc.loadingVerification")}</span>
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
      ? t("verification.pendingChangesTitle")
      : isApproved
        ? t("verification.verifiedTitle")
        : isUnderReview
          ? t("verification.underReviewTitle")
          : isRejected
            ? t("verification.rejectedTitle")
            : t("misc.completeForVerification", { pct: completion_percentage });

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

  if (isApproved && dismissedFor === "APPROVED") return null;

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
      aria-label={t("verification.collapseLabel")}
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
              <p className="font-medium">{t("verification.pendingChangesTitle")}</p>
              <p className="text-amber-700 mt-1">
                {t("verification.pendingChangesBody")}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2 border-amber-400 text-amber-800 hover:bg-amber-100">
                <Link href="/dashboard/edit-doctor-profile">{t("verification.viewMyChanges")}</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isApproved) {
    // Ya lo cerró y el perfil sigue aprobado: no vuelve a aparecer.
    if (dismissedFor === "APPROVED") return null;

    return wrap(
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div className="min-w-0 flex-1 text-sm text-green-800">
            <p className="font-medium">{t("verification.verifiedTitle")}</p>
            <p className="text-green-700">{t("misc.approvedVisible")}</p>
          </div>
          <button
            type="button"
            onClick={() => dismiss("APPROVED")}
            aria-label={t("verification.dismiss")}
            className="shrink-0 rounded-md p-1.5 text-green-700 transition-colors hover:bg-green-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            <X className="h-4 w-4" />
          </button>
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
              <p className="font-medium">{t("verification.underReviewTitle")}</p>
              <p className="text-blue-700 mt-1">
                {t("misc.underReviewFull")}
              </p>
              <p className="text-blue-600 mt-2 text-xs">
                {t("verification.underReviewNote")}
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
              <p className="font-medium">{t("verification.rejectedTitle")}</p>
              <p className="text-red-700 mt-1">
                {t("verification.rejectedBody")}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-2">
                <Link href="/dashboard/edit-doctor-profile">{t("verification.editProfile")}</Link>
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
            <p className="font-medium text-amber-900">{t("misc.completeToRequest")}</p>
            <p className="text-amber-800 text-sm mt-1">
              {t("misc.incompleteFull")}
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
                    {t("ui.goEditProfile")} <ChevronRight className="h-3.5 w-3.5" />
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
