"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import type { Locale } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { CalendarIcon, MapPinIcon, Loader2, Star } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";
import { AppointmentsEmptyState } from "./AppointmentsEmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Appointment } from "@/app/types/types";
import {
  getAppointments,
  getDoctorAppointments,
  cancelAppointment,
  createReview,
  checkInAppointment,
  checkOutAppointment,
  markNoShow,
} from "@/lib/appointments-api";

type Tab = "proximas" | "pasadas" | "canceladas";

const TABS: Tab[] = ["proximas", "pasadas", "canceladas"];

const UPCOMING = ["PENDING", "IN_PROCESS"];
const PAST = ["COMPLETED", "NO_SHOW"];
const CANCELED = ["CANCELED_BY_PATIENT", "CANCELED_BY_DOCTOR"];

// El estado viaja como enum del backend; aquí sólo se mapea a una clave.
const STATUS_KEYS: Record<string, TranslationKey> = {
  PENDING: "appointments.statusPending",
  IN_PROCESS: "appointments.statusInProcess",
  COMPLETED: "appointments.statusCompleted",
  NO_SHOW: "appointments.statusNoShow",
  CANCELED_BY_PATIENT: "appointments.statusCanceledByPatient",
  CANCELED_BY_DOCTOR: "appointments.statusCanceledByDoctor",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-700",
  IN_PROCESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  NO_SHOW: "bg-gray-100 text-gray-600",
  CANCELED_BY_PATIENT: "bg-red-100 text-red-600",
  CANCELED_BY_DOCTOR: "bg-red-100 text-red-600",
};

function formatDate(d: string, pattern: string, dateLocale: Locale) {
  try {
    return format(parseISO(d), pattern, { locale: dateLocale });
  } catch {
    return d;
  }
}

function formatTime(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

interface Props {
  role: "patient" | "doctor";
}

export function AppointmentsList({ role }: Props) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? enUS : es;
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("proximas");

  // Cancel dialog
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Review dialog
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Doctor action state
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      if (role === "doctor") {
        setAppointments(await getDoctorAppointments());
      } else {
        setAppointments(await getAppointments());
      }
    } catch {
      setFetchError(t("appointments.loadError"));
    } finally {
      setLoading(false);
    }
  }, [role, t]);

  useEffect(() => {
    load();
  }, [load]);

  const isDatePast = (appt: Appointment): boolean => {
    if (!appt.schedule) return false;
    try {
      const dateStr = appt.schedule.date_of_service;
      const todayStr = format(new Date(), "yyyy-MM-dd");
      if (dateStr < todayStr) return true;
      if (dateStr > todayStr) return false;
      const [h, m] = appt.schedule.end_time.split(":").map(Number);
      const now = new Date();
      return now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);
    } catch {
      return false;
    }
  };

  /**
   * Si ahora cae dentro de la ventana de check-in del backend:
   * desde el inicio del turno hasta 30 min después de su fin.
   *
   * Sin esto el botón aparecía para una cita de la semana entrante y fallaba
   * con un 400 al pulsarlo: el servidor validaba bien y la UI no lo reflejaba.
   */
  const checkInWindow = (appt: Appointment): "early" | "open" | "closed" => {
    if (!appt.schedule) return "closed";
    const { date_of_service, start_time, end_time } = appt.schedule;
    const inicio = new Date(`${date_of_service}T${start_time}`);
    const fin = new Date(`${date_of_service}T${end_time}`);
    const cierre = new Date(fin.getTime() + 30 * 60 * 1000);
    const ahora = new Date();
    if (ahora < inicio) return "early";
    return ahora <= cierre ? "open" : "closed";
  };

  const handleCheckOut = async (id: string) => {
    setActionLoading(id);
    setActionError(null);
    try {
      const updated = await checkOutAppointment(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (e: unknown) {
      setActionError(
        e instanceof Error ? e.message : t("appointments.checkOutError")
      );
    } finally {
      setActionLoading(null);
    }
  };

  const tabLabel = (value: Tab) =>
    value === "proximas"
      ? t("appointments.tabUpcoming")
      : value === "pasadas"
      ? t("appointments.tabPast")
      : t("appointments.tabCanceled");

  // Una sola definición de "qué cae en cada pestaña", usada por la lista y por
  // los contadores. Duplicarla era la forma segura de que el número dijera una
  // cosa y la lista mostrara otra.
  const forTab = useCallback(
    (which: Tab) =>
      appointments.filter((a) => {
        const datePast = isDatePast(a);
        if (which === "proximas")
          return UPCOMING.includes(a.status) && !datePast;
        if (which === "pasadas")
          return (
            PAST.includes(a.status) ||
            (UPCOMING.includes(a.status) && datePast)
          );
        return CANCELED.includes(a.status);
      }),
    [appointments]
  );

  const visible = forTab(tab);
  const countFor = (which: Tab) => forTab(which).length;

  // Un role="tablist" sin flechas es peor que no ponerlo: se anuncia como
  // pestañas y luego no responde como pestañas.
  const handleTabKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const delta =
      e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = TABS[(TABS.indexOf(tab) + delta + TABS.length) % TABS.length];
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    setCanceling(true);
    setCancelError(null);
    try {
      const updated = await cancelAppointment(cancelId, cancelReason || undefined);
      setAppointments((prev) =>
        prev.map((a) => (a.id === cancelId ? updated : a))
      );
      setCancelId(null);
    } catch (e: unknown) {
      setCancelError(
        e instanceof Error ? e.message : t("appointments.cancelError")
      );
    } finally {
      setCanceling(false);
    }
  };

  const handleReview = async () => {
    if (!reviewId || rating === 0) return;
    setSubmitting(true);
    setReviewError(null);
    try {
      const review = await createReview(reviewId, rating, comment || undefined);
      setAppointments((prev) =>
        prev.map((a) => (a.id === reviewId ? { ...a, review } : a))
      );
      setReviewId(null);
    } catch (e: unknown) {
      setReviewError(
        e instanceof Error ? e.message : t("appointments.reviewError")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckIn = async (id: string) => {
    setActionLoading(id);
    setActionError(null);
    try {
      const updated = await checkInAppointment(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (e: unknown) {
      setActionError(
        e instanceof Error ? e.message : t("appointments.checkInError")
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (id: string) => {
    setActionLoading(id);
    setActionError(null);
    try {
      const updated = await markNoShow(id);
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (e: unknown) {
      setActionError(
        e instanceof Error ? e.message : t("appointments.noShowError")
      );
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-3">{fetchError}</p>
        <Button variant="outline" onClick={load}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <>
      {/*
        Control segmentado en vez de tres pestañas subrayadas: se lee como un
        solo control con un estado activo, y recoge el lenguaje de píldoras
        (rounded-full, azul) que ya usan el buscador y los botones del sitio.
        El contador es la mitad del valor: el doctor entra a saber cuántas
        tiene hoy, no a leer tres etiquetas.
      */}
      <div
        role="tablist"
        aria-label={t("appointments.pageTitle")}
        onKeyDown={handleTabKeys}
        className="inline-flex w-full sm:w-auto items-center gap-1 rounded-full bg-gray-100 p-1 mb-5"
      >
        {TABS.map((t2) => {
          const isActive = tab === t2;
          const count = countFor(t2);
          return (
            <button
              key={t2}
              id={`tab-${t2}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls="appointments-panel"
              tabIndex={isActive ? 0 : -1}
              onClick={() => setTab(t2)}
              className={cn(
                "flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm whitespace-nowrap",
                "transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
                isActive
                  ? "bg-white font-semibold text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              )}
            >
              {tabLabel(t2)}
              {count > 0 && (
                <span
                  className={cn(
                    "min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-[11px] font-semibold leading-none",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {actionError && (
        <div className="mb-3 p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {actionError}
        </div>
      )}

      <div id="appointments-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>

      {visible.length === 0 ? (
        <AppointmentsEmptyState tab={tab} role={role} />
      ) : (
        <div className="space-y-4">
          {visible.map((appt) => {
            const person =
              role === "patient" ? appt.doctor : appt.patient;
            const isActing = actionLoading === appt.id;
            return (
              <div
                key={appt.id}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
              >
                {/* Header: date + status badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <p className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <CalendarIcon className="w-4 h-4 text-blue-500 shrink-0" />
                    {appt.schedule
                      ? `${formatDate(appt.schedule.date_of_service, t("formats.dateLong"), dateLocale)} · ${formatTime(
                          appt.schedule.start_time
                        )} – ${formatTime(appt.schedule.end_time)}`
                      : t("appointments.dateUnavailable")}
                  </p>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      STATUS_COLORS[appt.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_KEYS[appt.status] ? t(STATUS_KEYS[appt.status]) : appt.status}
                  </span>
                </div>

                {/* Body: person info + actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <UserAvatar
                    src={person?.profile_picture}
                    name={person?.name}
                    lastname={person?.lastname}
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                  />

                  <div className="flex-grow min-w-0">
                    <h4 className="font-semibold text-base truncate">
                      {person
                        ? `${role === "patient" ? "Dr. " : ""}${person.name} ${person.lastname}`
                        : "—"}
                    </h4>

                    {appt.schedule?.office && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPinIcon className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">
                          {appt.schedule.office.name}
                          {appt.schedule.office.address
                            ? ` · ${appt.schedule.office.address}`
                            : ""}
                        </span>
                      </p>
                    )}

                    {appt.auto_closed_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        {t("appointments.autoClosed")}
                      </p>
                    )}

                    {appt.cancel_reason && (
                      <p className="text-xs text-gray-400 mt-1">
                        {t("appointments.reasonLabel")} {appt.cancel_reason}
                      </p>
                    )}

                    {appt.review && (
                      <div className="flex items-center gap-0.5 mt-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < appt.review!.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-200"
                            }`}
                          />
                        ))}
                        {appt.review.comment && (
                          <span className="text-xs text-gray-500 ml-1.5 truncate">
                            &ldquo;{appt.review.comment}&rdquo;
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 shrink-0 flex-wrap">
                    {role === "patient" && appt.status === "PENDING" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCancelId(appt.id);
                          setCancelReason("");
                          setCancelError(null);
                        }}
                      >
                        {t("appointments.actionCancel")}
                      </Button>
                    )}

                    {role === "patient" &&
                      appt.status === "COMPLETED" &&
                      !appt.review && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setReviewId(appt.id);
                            setRating(0);
                            setComment("");
                            setReviewError(null);
                          }}
                        >
                          {t("appointments.actionReview")}
                        </Button>
                      )}

                    {role === "doctor" && appt.status === "IN_PROCESS" && (
                      <Button
                        size="sm"
                        disabled={isActing}
                        onClick={() => handleCheckOut(appt.id)}
                      >
                        {isActing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("appointments.actionCheckOut")
                        )}
                      </Button>
                    )}

                    {role === "doctor" && appt.status === "PENDING" && (
                      <>
                        {/* El botón solo aparece dentro de la ventana real;
                            fuera de ella se dice por qué, en vez de dejar un
                            botón que falla al pulsarlo. */}
                        {checkInWindow(appt) === "open" ? (
                          <Button
                            size="sm"
                            disabled={isActing}
                            onClick={() => handleCheckIn(appt.id)}
                          >
                            {isActing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              t("appointments.actionCheckIn")
                            )}
                          </Button>
                        ) : (
                          <span className="self-center text-xs text-gray-400">
                            {checkInWindow(appt) === "early"
                              ? t("appointments.tooEarly")
                              : t("appointments.windowClosed")}
                          </span>
                        )}
                        {checkInWindow(appt) !== "early" && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isActing}
                            onClick={() => handleNoShow(appt.id)}
                          >
                            {t("appointments.actionNoShow")}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isActing}
                          onClick={() => {
                            setCancelId(appt.id);
                            setCancelReason("");
                            setCancelError(null);
                          }}
                        >
                          {t("appointments.actionCancel")}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* Cancel Dialog */}
      <Dialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("appointments.cancelDialogTitle")}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 -mt-2">
            {t("appointments.cancelDialogBody")}
          </p>
          <Textarea
            placeholder={t("appointments.cancelReasonPlaceholder")}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            rows={3}
          />
          {cancelError && (
            <p className="text-sm text-red-500">{cancelError}</p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelId(null)}
              disabled={canceling}
            >
              {t("appointments.cancelDialogBack")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={canceling}
            >
              {canceling && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t("appointments.cancelDialogConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog
        open={!!reviewId}
        onOpenChange={(open) => !open && setReviewId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("appointments.reviewDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              {t("appointments.reviewPrompt")}
            </p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      s <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder={t("appointments.reviewCommentPlaceholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
            {reviewError && (
              <p className="text-sm text-red-500">{reviewError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewId(null)}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleReview}
              disabled={rating === 0 || submitting}
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t("appointments.reviewSubmit")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
