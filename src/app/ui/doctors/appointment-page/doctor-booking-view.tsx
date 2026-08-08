"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { format, addMonths, startOfToday, parseISO, isBefore, isAfter, isSameDay } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Heart, MapPin, Clock, ArrowLeft, Loader2, CheckCircle2,
  Phone, Globe, CreditCard, Award, ChevronLeft, ChevronRight,
  FileText, Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { UserAvatar } from "@/components/UserAvatar";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";
import Link from "next/link";
import { getDoctorProfile, getDoctorAvailability, createAppointment } from "@/lib/doctors-api";
import type { DoctorFullProfile, AvailabilitySlot, OfficeFull, CertificatePublic } from "@/app/types/types";

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

// ─── Photo carousel ───────────────────────────────────────────────────────────
function PhotoCarousel({ photos, officeName }: { photos: string[]; officeName: string }) {
  const [idx, setIdx] = useState(0);
  if (photos.length === 0) return null;

  return (
    <div className="relative w-full h-48 rounded-lg overflow-hidden bg-gray-100 mb-3">
      <Image
        src={photos[idx]}
        alt={`${officeName} foto ${idx + 1}`}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 400px"
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={() => setIdx((i) => (i - 1 + photos.length) % photos.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % photos.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={cn("w-1.5 h-1.5 rounded-full transition-colors", i === idx ? "bg-white" : "bg-white/50")}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Office card ──────────────────────────────────────────────────────────────
function OfficeCard({ office, t }: { office: OfficeFull; t: (k: TranslationKey) => string }) {
  return (
    <div className="rounded-xl border bg-gray-50 p-4 space-y-3">
      <PhotoCarousel photos={office.photos} officeName={office.name} />

      <div>
        <h4 className="font-semibold text-gray-900 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-blue-500 shrink-0" />
          {office.name}
        </h4>
        <p className="text-sm text-muted-foreground mt-0.5 ml-6">
          {office.address}, {office.city_name}, {office.department_name}
        </p>
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Phone className="h-3.5 w-3.5 shrink-0 text-blue-400" />
          <span>{office.phone_primary}</span>
        </div>
        {office.phone_secondary && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <span>{office.phone_secondary}</span>
          </div>
        )}
        {office.website_url && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0 text-blue-400" />
            <a href={office.website_url} target="_blank" rel="noopener noreferrer"
              className="underline hover:text-blue-600 truncate">
              {office.website_url}
            </a>
          </div>
        )}
      </div>

      {office.payment_methods.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1 mb-1.5">
            <CreditCard className="h-3.5 w-3.5" /> {t("booking.paymentMethods")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {office.payment_methods.map((pm) => (
              <span key={pm} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5">
                {pm}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Certificates ─────────────────────────────────────────────────────────────
function CertificatesSection({ certificates, t }: { certificates: CertificatePublic[]; t: (k: TranslationKey, v?: Record<string, string | number>) => string }) {
  if (!certificates.length) return null;
  return (
    <div className="mb-5">
      <h3 className="font-semibold mb-2.5 flex items-center gap-2 text-sm">
        <Award className="h-4 w-4 text-blue-500" /> {t("booking.certificates")}
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {certificates.map((cert, i) => (
          <a
            key={cert.id}
            href={cert.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-3 rounded-lg border bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
          >
            <FileText className="h-8 w-8 text-gray-400 group-hover:text-blue-500 transition-colors" />
            <span className="text-xs text-muted-foreground text-center">{t("booking.certificateLabel", { n: i + 1 })}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Chip list ────────────────────────────────────────────────────────────────
function ChipList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">—</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="text-xs bg-gray-100 text-gray-700 rounded-full px-2.5 py-1">
          {item}
        </span>
      ))}
    </div>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={cn("h-1.5 w-1.5 rounded-full", className)} />;
}

const DENSITY_STYLES = {
  high: "bg-green-500",
  low: "bg-amber-400",
  full: "bg-red-400",
} as const;

/**
 * Un día del calendario con su punto de disponibilidad.
 *
 * Verde: más de dos turnos libres. Ámbar: uno o dos. Rojo: el doctor publicó
 * ese día y ya no queda ninguno. Sin punto: no publicó nada.
 *
 * El punto va debajo del número y no detrás, para no pelearse con el fondo
 * del día seleccionado.
 */
function DayWithDensity({
  date,
  density,
}: {
  date: Date;
  density: "high" | "low" | "full" | null;
}) {
  return (
    <span className="relative flex h-full w-full items-center justify-center">
      {date.getDate()}
      {density && (
        <span
          aria-hidden
          className={cn(
            "absolute bottom-0.5 h-1.5 w-1.5 rounded-full",
            DENSITY_STYLES[density]
          )}
        />
      )}
    </span>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function DoctorBookingView({ doctorId, onBack }: DoctorBookingViewProps) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? enUS : es;
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
    } catch {
      setError(t("booking.profileLoadError"));
    } finally {
      setLoadingProfile(false);
    }
  }, [doctorId, t]);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const from = format(today, "yyyy-MM-dd");
      const to = format(addMonths(today, 2), "yyyy-MM-dd");
      const data = await getDoctorAvailability({ doctor_id: doctorId, date_from: from, date_to: to });
      setSlots(data.available_slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [doctorId]);

  useEffect(() => { loadProfile(); }, [loadProfile]);
  useEffect(() => { loadSlots(); }, [loadSlots]);

  /**
   * Turnos libres por fecha, en "yyyy-MM-dd".
   *
   * Los turnos de dos meses ya vienen en una sola petición, así que pintar el
   * calendario no cuesta nada extra. Antes esa información estaba cargada y no
   * se usaba: el paciente tenía que ir día por día, a ciegas, para descubrir
   * dónde quedaba cupo.
   */
  const freeByDate = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const slot of slots) {
      const clave = String(slot.date_of_service).slice(0, 10);
      const previos = mapa.get(clave) ?? 0;
      mapa.set(clave, previos + (slot.is_booked ? 0 : 1));
    }
    return mapa;
  }, [slots]);

  /** `full` solo si el doctor publicó ese día y ya no queda nada. */
  const densityFor = useCallback(
    (day: Date): "high" | "low" | "full" | null => {
      const clave = format(day, "yyyy-MM-dd");
      if (!freeByDate.has(clave)) return null;
      const libres = freeByDate.get(clave) ?? 0;
      if (libres === 0) return "full";
      return libres > 2 ? "high" : "low";
    },
    [freeByDate]
  );

  const availableSlotsByDate = selectedDate
    ? slots.filter((s) => {
        // isSameDay y no getTime(): comparar marcas de tiempo exactas depende
        // de que el backend mande la fecha sin hora. El día que mande un ISO
        // con Z, la igualdad falla en silencio y el paciente ve "no hay turnos".
        const d =
          typeof s.date_of_service === "string"
            ? parseISO(s.date_of_service)
            : new Date(s.date_of_service);
        return !s.is_booked && isSameDay(d, selectedDate);
      })
    : [];

  const handleConfirm = async () => {
    if (!selectedSlot || !profile) return;
    setSubmitting(true);
    setError(null);
    try {
      await createAppointment(selectedSlot.id, profile.doctor_id);
      setSuccess(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("booking.bookError");
      if (msg.includes("401") || msg.includes("Session") || msg.includes("expired")) {
        setError(t("booking.loginAsPatient"));
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
        {loadingProfile
          ? <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
          : <div className="text-center">
              <p className="text-muted-foreground mb-4">{error || t("booking.profileNotFound")}</p>
              <Button variant="outline" onClick={onBack}>{t("booking.backToSearch")}</Button>
            </div>
        }
      </div>
    );
  }

  if (success) {
    return (
      <div className="container max-w-lg mx-auto xl:px-16 px-6 py-12 text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold mb-2">{t("booking.successTitle")}</h2>
        <p className="text-muted-foreground mb-6">
          {t("booking.successBody", { doctor: `${profile.name} ${profile.lastname}` })}
        </p>
        <div className="flex gap-2 justify-center flex-wrap">
          <Button asChild><Link href="/dashboard/appointments">{t("booking.viewMyAppointments")}</Link></Button>
          <Button variant="outline" onClick={onBack}>{t("booking.bookAnother")}</Button>
        </div>
      </div>
    );
  }

  const primaryOffice = profile.offices?.[0];

  return (
    <div className="container mx-auto xl:px-16 px-6 2xl:px-0 sm:px-16 py-4 md:py-6 lg:py-5 lg:pb-32">
      <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2">
        <ArrowLeft className="h-4 w-4 mr-2" /> {t("booking.backToSearch")}
      </Button>

      <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
        {/* ── Left: profile ── */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              {/* Header row */}
              <div className="flex justify-between items-start mb-6">
                <h1 className="text-2xl font-bold">{t("booking.doctorProfileTitle")}</h1>
                <Button variant="ghost" size="icon" onClick={() => setIsLiked(!isLiked)}>
                  <Heart className={cn("h-5 w-5", isLiked && "fill-blue-500 text-blue-500")} />
                </Button>
              </div>

              {/* Identity */}
              {/*
                La foto es lo primero que mira un paciente al elegir médico,
                y a 80px competía en peso con el texto de al lado. A 128 tiene
                jerarquía propia; el anillo la despega del fondo.
              */}
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start text-center sm:text-left mb-6">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-full bg-muted ring-4 ring-blue-50">
                  <UserAvatar
                    src={profile.profile_picture}
                    name={profile.name}
                    lastname={profile.lastname}
                    fill
                    sizes="128px"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold">{profile.name} {profile.lastname}</h2>
                  <p className="text-sm text-muted-foreground">
                    {profile.specialties?.length ? profile.specialties.join(" · ") : "—"}
                  </p>
                  {primaryOffice && (
                    <div className="flex items-center justify-center sm:justify-start gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{primaryOffice.city_name}, {primaryOffice.department_name}</span>
                    </div>
                  )}
                  {profile.professional_card_number && (
                    <p className="text-xs text-gray-400 mt-1">
                      {t("booking.professionalCard")} <span className="font-mono">{profile.professional_card_number}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Experience */}
              {profile.work_experience?.length > 0 && (
                <div className="flex gap-3 mb-5">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                    <div className="font-semibold text-sm">{profile.work_experience.length}+</div>
                    <div className="text-xs text-muted-foreground">{t("booking.yearsExperience")}</div>
                  </div>
                </div>
              )}

              {/* Description */}
              {profile.description && (
                <div className="mb-5">
                  <h3 className="font-semibold mb-1.5">{t("booking.aboutMe")}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{profile.description}</p>
                </div>
              )}

              {/* Specialties + Languages */}
              <div className="grid sm:grid-cols-2 gap-4 mb-5">
                {profile.specialties?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1.5 text-sm">{t("booking.specialties")}</h3>
                    <ChipList items={profile.specialties} />
                  </div>
                )}
                {profile.languages?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-1.5 text-sm">{t("booking.languages")}</h3>
                    <ChipList items={profile.languages} />
                  </div>
                )}
              </div>

              {/* Universities */}
              {profile.universities?.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold mb-1.5 text-sm">{t("booking.education")}</h3>
                  <ChipList items={profile.universities} />
                </div>
              )}

              {/* Services */}
              {profile.services?.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold mb-1.5 text-sm">{t("booking.services")}</h3>
                  <ChipList items={profile.services} />
                </div>
              )}

              {/* Treated diseases */}
              {profile.treated_diseases?.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold mb-1.5 text-sm">{t("booking.treatedDiseases")}</h3>
                  <ChipList items={profile.treated_diseases} />
                </div>
              )}

              {/* Insurances */}
              {profile.insurances?.length > 0 && (
                <div className="mb-5">
                  <h3 className="font-semibold mb-1.5 text-sm">{t("booking.insurances")}</h3>
                  <ChipList items={profile.insurances} />
                </div>
              )}

              {/* Certificates */}
              <CertificatesSection certificates={profile.certificates ?? []} t={t} />
            </CardContent>
          </Card>

          {/* Offices */}
          {profile.offices?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                {t("booking.officesTitle", { count: profile.offices.length })}
              </h2>
              <div className="space-y-4">
                {profile.offices.map((office) => (
                  <OfficeCard key={office.id} office={office} t={t} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: booking ── */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-bold mb-5">{t("booking.bookTitle")}</h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                  {error}
                  {error.includes("sesión") && (
                    <span className="block mt-2">
                      <Link href="/login" className="underline font-medium">{t("booking.signInLink")}</Link>
                    </span>
                  )}
                </div>
              )}

              <div className="mb-5 flex flex-col items-center">
                <h3 className="font-semibold mb-3 self-start text-sm">{t("booking.pickDate")}</h3>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { setSelectedDate(d); setSelectedSlot(null); }}
                  locale={dateLocale}
                  disabled={(date) => isBefore(date, today) || isAfter(date, maxDate)}
                  className="rounded-md border"
                  components={{
                    DayContent: (props) => (
                      <DayWithDensity
                        date={props.date}
                        density={densityFor(props.date)}
                      />
                    ),
                  }}
                />

                {/* Leyenda: sin ella tres colores de punto son un acertijo */}
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Dot className="bg-green-500" />
                    {t("booking.densityHigh")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Dot className="bg-amber-400" />
                    {t("booking.densityLow")}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Dot className="bg-red-400" />
                    {t("booking.densityFull")}
                  </span>
                </div>
              </div>

              {selectedDate && (
                <div className="mb-5">
                  <h3 className="font-semibold mb-3 text-sm">{t("booking.availableSlots")}</h3>
                  {loadingSlots
                    ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    : availableSlotsByDate.length === 0
                      ? <p className="text-sm text-muted-foreground">{t("booking.noSlots")}</p>
                      : (
                        <div className="grid grid-cols-2 gap-2">
                          {availableSlotsByDate.map((slot) => (
                            <Button
                              key={slot.id}
                              variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                              className="w-full text-xs"
                              onClick={() => setSelectedSlot(slot)}
                            >
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </Button>
                          ))}
                        </div>
                      )
                  }
                </div>
              )}

              <Button
                className="w-full" size="lg"
                disabled={!selectedSlot || submitting}
                onClick={handleConfirm}
              >
                {submitting
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("booking.confirming")}</>
                  : t("booking.confirmBooking")
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
