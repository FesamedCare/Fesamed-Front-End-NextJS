"use client";

import { useState, useEffect, useCallback } from "react";
import { format, addMonths, startOfToday, parseISO, isBefore, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart,
  MapPin,
  Clock,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { getDoctorProfile, getDoctorAvailability, createAppointment } from "@/lib/doctors-api";
import type { DoctorFullProfile, AvailabilitySlot } from "@/app/types/types";

const defaultImage = "https://via.placeholder.com/150?text=Doctor";

interface DoctorBookingViewProps {
  doctorId: string;
  onBack: () => void;
}

function formatTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function DoctorBookingView({ doctorId, onBack }: DoctorBookingViewProps) {
  const [profile, setProfile] = useState<DoctorFullProfile | null>(null);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);

  const today = startOfToday();
  const maxDate = addMonths(today, 2);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setError(null);
    try {
      const p = await getDoctorProfile(doctorId);
      setProfile(p);
    } catch (e) {
      setError("No se pudo cargar el perfil. Intenta de nuevo.");
      setProfile(null);
    } finally {
      setLoadingProfile(false);
    }
  }, [doctorId]);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const t = startOfToday();
      const from = format(t, "yyyy-MM-dd");
      const to = format(addMonths(t, 2), "yyyy-MM-dd");
      const data = await getDoctorAvailability({
        doctor_id: doctorId,
        date_from: from,
        date_to: to,
      });
      setSlots(data.available_slots ?? []);
    } catch (e) {
      console.error("Availability error:", e);
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const availableSlotsByDate = selectedDate
    ? slots.filter((s) => {
        const d = typeof s.date_of_service === "string"
          ? parseISO(s.date_of_service)
          : new Date(s.date_of_service);
        return (
          !s.is_booked &&
          d.getTime() === selectedDate.getTime()
        );
      })
    : [];

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !profile) return;
    setSubmitting(true);
    setError(null);
    try {
      await createAppointment(selectedSlot.id, profile.doctor_id);
      setSuccess(true);
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "No se pudo agendar. Intenta de nuevo.";
      if (msg.includes("401") || msg.includes("Session") || msg.includes("expired")) {
        setError("Inicia sesión como paciente para agendar.");
      } else if (msg.includes("verificar") || msg.includes("correo") || msg.includes("teléfono")) {
        setError("Debes verificar tu correo y teléfono antes de agendar.");
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingProfile || !profile) {
    return (
      <div className="container mx-auto xl:px-16 px-6 py-12 flex justify-center items-center min-h-[320px]">
        {loadingProfile ? (
          <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        ) : (
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{error || "Perfil no encontrado."}</p>
            <Button variant="outline" onClick={onBack}>Volver a búsqueda</Button>
          </div>
        )}
      </div>
    );
  }

  if (success) {
    return (
      <div className="container max-w-lg mx-auto xl:px-16 px-6 py-12 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Cita agendada</h2>
        <p className="text-muted-foreground mb-6">
          Tu cita con {profile.name} {profile.lastname} ha sido registrada. Revisa tu correo para más detalles.
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button asChild><Link href="/dashboard/appointments">Ver mis citas</Link></Button>
          <Button variant="outline" onClick={onBack}>Agendar otra cita</Button>
        </div>
      </div>
    );
  }

  const location =
    profile.offices?.length > 0
      ? `${profile.offices[0].name}, ${profile.offices[0].city_name}`
      : profile.offices?.length
        ? profile.offices[0].city_name
        : "—";

  return (
    <div className="container mx-auto xl:px-16 px-6 2xl:px-0 sm:px-16 py-4 md:py-6 lg:py-5 lg:pb-32">
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver a búsqueda
      </Button>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-2xl font-bold mb-6">Detalles del doctor</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsLiked(!isLiked)}
                className="text-muted-foreground hover:text-blue-500"
              >
                <Heart className={cn("h-5 w-5", isLiked && "fill-blue-500 text-blue-500")} />
              </Button>
            </div>
            <div className="flex gap-4 items-start mb-6">
              <div className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden bg-muted">
                <Image
                  src={profile.profile_picture || defaultImage}
                  alt={`${profile.name} ${profile.lastname}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                  unoptimized={profile.profile_picture?.startsWith("http") === false}
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {profile.name} {profile.lastname}
                </h2>
                <p className="text-muted-foreground">
                  {profile.specialties?.length ? profile.specialties.join(", ") : "—"}
                </p>
                <div className="flex items-center gap-1 text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{location}</span>
                </div>
              </div>
            </div>
            {profile.work_experience?.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Clock className="h-5 w-5 mx-auto mb-2" />
                  <div className="font-semibold">{profile.work_experience.length}+</div>
                  <div className="text-sm text-muted-foreground">experiencia</div>
                </div>
              </div>
            )}
            {profile.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Sobre mí</h3>
                <p className="text-muted-foreground">{profile.description}</p>
              </div>
            )}
            {profile.services?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Servicios</h3>
                <p className="text-muted-foreground">{profile.services.join(", ")}</p>
              </div>
            )}
            {profile.insurances?.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Aseguradoras</h3>
                <p className="text-muted-foreground">{profile.insurances.join(", ")}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-6">Agendar cita</h2>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
                {(error.includes("sesión") || error.includes("Inicia sesión")) && (
                  <span className="block mt-2">
                    <Link href="/login" className="underline font-medium">Iniciar sesión</Link>
                  </span>
                )}
              </div>
            )}

            <div className="mb-6 flex flex-col items-center">
              <h3 className="font-semibold mb-4">Selecciona la fecha</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                locale={es}
                disabled={(date) =>
                  isBefore(date, today) || isAfter(date, maxDate)
                }
                className="rounded-md border"
              />
            </div>

            {selectedDate && (
              <div className="mb-6">
                <h3 className="font-semibold mb-4">Horarios disponibles</h3>
                {loadingSlots ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : availableSlotsByDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay turnos para esta fecha. Elige otra.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {availableSlotsByDate.map((slot) => (
                      <Button
                        key={slot.id}
                        variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                        className="w-full"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              disabled={!selectedSlot || submitting}
              onClick={handleConfirm}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Confirmando...
                </>
              ) : (
                "Confirmar cita"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
