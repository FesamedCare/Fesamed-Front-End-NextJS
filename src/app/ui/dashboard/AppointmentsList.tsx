"use client";

import { useState, useEffect, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, MapPinIcon, Loader2, Star } from "lucide-react";
import Image from "next/image";
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
  markNoShow,
} from "@/lib/appointments-api";

type Tab = "proximas" | "pasadas" | "canceladas";

const UPCOMING = ["PENDING", "IN_PROCESS"];
const PAST = ["COMPLETED", "NO_SHOW"];
const CANCELED = ["CANCELED_BY_PATIENT", "CANCELED_BY_DOCTOR"];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  IN_PROCESS: "En proceso",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
  CANCELED_BY_PATIENT: "Cancelada por paciente",
  CANCELED_BY_DOCTOR: "Cancelada por médico",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-blue-100 text-blue-700",
  IN_PROCESS: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  NO_SHOW: "bg-gray-100 text-gray-600",
  CANCELED_BY_PATIENT: "bg-red-100 text-red-600",
  CANCELED_BY_DOCTOR: "bg-red-100 text-red-600",
};

function formatDate(d: string) {
  try {
    return format(parseISO(d), "d 'de' MMMM yyyy", { locale: es });
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
        const page = await getDoctorAppointments({ size: 100 });
        setAppointments(page.items);
      } else {
        setAppointments(await getAppointments());
      }
    } catch {
      setFetchError("No se pudieron cargar las citas.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = appointments.filter((a) =>
    tab === "proximas"
      ? UPCOMING.includes(a.status)
      : tab === "pasadas"
      ? PAST.includes(a.status)
      : CANCELED.includes(a.status)
  );

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
        e instanceof Error ? e.message : "Error al cancelar la cita."
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
        e instanceof Error ? e.message : "Error al enviar la reseña."
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
        e instanceof Error ? e.message : "Error al registrar la llegada."
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
        e instanceof Error ? e.message : "Error al marcar como no asistida."
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
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Tabs */}
      <div className="flex border-b mb-4">
        {(["proximas", "pasadas", "canceladas"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2 px-4 text-sm transition-colors ${
              tab === t
                ? "border-b-2 border-blue-500 font-semibold text-blue-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t === "proximas"
              ? "Próximas"
              : t === "pasadas"
              ? "Pasadas"
              : "Canceladas"}
          </button>
        ))}
      </div>

      {actionError && (
        <div className="mb-3 p-3 rounded-md bg-red-50 text-red-600 text-sm">
          {actionError}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="text-gray-500 text-sm py-6 px-2">
          No hay citas en esta categoría.
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((appt) => {
            const person =
              role === "patient" ? appt.doctor : appt.patient;
            const isActing = actionLoading === appt.id;
            const fallbackSrc = `https://via.placeholder.com/80?text=${encodeURIComponent(
              person ? person.name.charAt(0) : "?"
            )}`;

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
                      ? `${formatDate(appt.schedule.date_of_service)} · ${formatTime(
                          appt.schedule.start_time
                        )} – ${formatTime(appt.schedule.end_time)}`
                      : "Fecha no disponible"}
                  </p>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      STATUS_COLORS[appt.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABELS[appt.status] || appt.status}
                  </span>
                </div>

                {/* Body: person info + actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <Image
                    src={person?.profile_picture || fallbackSrc}
                    alt={
                      person
                        ? `${person.name} ${person.lastname}`
                        : "Usuario"
                    }
                    width={64}
                    height={64}
                    className="w-16 h-16 rounded-full object-cover shrink-0"
                    unoptimized
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

                    {appt.cancel_reason && (
                      <p className="text-xs text-gray-400 mt-1">
                        Motivo: {appt.cancel_reason}
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
                        Cancelar
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
                          Reseñar
                        </Button>
                      )}

                    {role === "doctor" && appt.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          disabled={isActing}
                          onClick={() => handleCheckIn(appt.id)}
                        >
                          {isActing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Check-in"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isActing}
                          onClick={() => handleNoShow(appt.id)}
                        >
                          No asistió
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

      {/* Cancel Dialog */}
      <Dialog
        open={!!cancelId}
        onOpenChange={(open) => !open && setCancelId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar cita</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 -mt-2">
            ¿Estás seguro de que deseas cancelar esta cita? Esta acción no se
            puede deshacer.
          </p>
          <Textarea
            placeholder="Motivo de cancelación (opcional)"
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
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={canceling}
            >
              {canceling && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Confirmar cancelación
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
            <DialogTitle>Dejar reseña</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Califica tu experiencia con el médico
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
              placeholder="Comentario (opcional)"
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
              Cancelar
            </Button>
            <Button
              onClick={handleReview}
              disabled={rating === 0 || submitting}
            >
              {submitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Enviar reseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
