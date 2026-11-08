"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, MessageSquareOff, X } from "lucide-react";
import { RatingStars } from "@/components/RatingStars";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";
import { apiClient } from "@/lib/api";
import type { AdminReview } from "@/app/types/types";

type Status = "PENDING" | "APPROVED" | "REJECTED";
const TABS: { status: Status; label: TranslationKey }[] = [
  { status: "PENDING", label: "reviews.tabPending" },
  { status: "APPROVED", label: "reviews.tabApproved" },
  { status: "REJECTED", label: "reviews.tabRejected" },
];

/**
 * Moderación de reseñas (cuestionario legal, 5.2): FesamedCare lee cada
 * comentario antes de publicarlo y puede rechazarlo o retirarlo con un motivo,
 * que ve el paciente. Las calificaciones sin texto se publican solas y aparecen
 * directamente en "Publicadas".
 */
export default function AdminReviewsPage() {
  const { t, locale } = useTranslation();
  const [status, setStatus] = useState<Status>("PENDING");
  const [items, setItems] = useState<AdminReview[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<{ items: AdminReview[]; counts: Record<string, number> }>(
        `/api/v1/admin/reviews/?status=${status}`,
      );
      setItems(res.items);
      setCounts(res.counts);
    } catch {
      setError(t("reviews.loadError"));
    } finally {
      setLoading(false);
    }
  }, [status, t]);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    setError("");
    try {
      await apiClient(`/api/v1/admin/reviews/${id}/${action}/`, {
        method: "POST",
        ...(action === "reject" ? { body: { reason: reason.trim() } } : {}),
      });
      setRejecting(null);
      setReason("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("reviews.actionError"));
    } finally {
      setBusy(null);
    }
  };

  const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }) : "—");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900">{t("reviews.adminTitle")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("reviews.adminSubtitle")}</p>

      <div role="tablist" className="mt-6 inline-flex rounded-full bg-gray-100 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.status}
            role="tab"
            aria-selected={status === tab.status}
            onClick={() => setStatus(tab.status)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              status === tab.status ? "bg-white font-medium text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            {t(tab.label)} <span className="ml-1 text-xs text-gray-400">{counts[tab.status] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 space-y-3">
        {loading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-sm text-gray-500">
            <MessageSquareOff className="h-6 w-6 text-gray-300" aria-hidden />
            {t("reviews.empty")}
          </div>
        ) : (
          items.map((r) => (
            <article key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <RatingStars value={r.rating} size="md" />
                <span className="text-xs text-gray-400">{fmt(r.created_at)}</span>
              </div>
              {r.comment ? (
                <p className="mt-3 whitespace-pre-line text-gray-800">{r.comment}</p>
              ) : (
                <p className="mt-3 text-sm italic text-gray-400">{t("reviews.noComment")}</p>
              )}
              <p className="mt-3 text-xs text-gray-500">
                {t("reviews.byFor", { patient: r.patient_name ?? "—", doctor: r.doctor_name ?? "—" })}
                {r.appointment_date && ` · ${t("reviews.appointmentOn", { date: fmt(r.appointment_date) })}`}
              </p>
              {r.moderation_status === "REJECTED" && r.reject_reason && (
                <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                  {t("reviews.reasonLabel")} {r.reject_reason}
                </p>
              )}

              {rejecting === r.id ? (
                <div className="mt-4 space-y-2">
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder={t("reviews.reasonPlaceholder")}
                    className="w-full rounded-lg border border-gray-200 p-2 text-sm focus:border-blue-400 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setRejecting(null); setReason(""); }} className="rounded-full px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
                      {t("account.cancel")}
                    </button>
                    <button
                      onClick={() => act(r.id, "reject")}
                      disabled={reason.trim().length < 3 || busy === r.id}
                      className="rounded-full bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {r.moderation_status === "APPROVED" ? t("reviews.confirmRetire") : t("reviews.confirmReject")}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex flex-wrap gap-2">
                  {r.moderation_status !== "APPROVED" && (
                    <button
                      onClick={() => act(r.id, "approve")}
                      disabled={busy === r.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      {t("reviews.approve")}
                    </button>
                  )}
                  {r.moderation_status !== "REJECTED" && (
                    <button
                      onClick={() => setRejecting(r.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-4 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      {r.moderation_status === "APPROVED" ? t("reviews.retire") : t("reviews.reject")}
                    </button>
                  )}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
