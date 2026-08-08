"use client";

import { useEffect, useState, type ReactNode } from "react";
import { format, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import {
  Building2,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import { ageFrom } from "@/lib/age";
import { doctorProfileUrl } from "@/lib/doctorProfileUrl";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";
import { getAppointmentContext } from "@/lib/appointments-api";
import type { Appointment, AppointmentContext } from "@/app/types/types";
import { STATUS_COLORS, STATUS_KEYS } from "./AppointmentsList";

const GENDER_KEYS: Record<string, TranslationKey> = {
  MASCULINO: "detail.genderMale",
  FEMENINO: "detail.genderFemale",
  OTRO: "detail.genderOther",
};

interface Props {
  appointment: Appointment | null;
  role: "patient" | "doctor";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Los mismos botones que pinta la tarjeta, no una copia. */
  actions?: ReactNode;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-gray-100 pt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ icon: Icon, children }: { icon: typeof Phone; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-blue-600">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 truncate text-gray-600">{children}</span>
    </div>
  );
}

export function AppointmentDetailDialog({
  appointment,
  role,
  open,
  onOpenChange,
  actions,
}: Props) {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? enUS : es;
  const [context, setContext] = useState<AppointmentContext | null>(null);

  const id = appointment?.id;

  useEffect(() => {
    if (!open || role !== "doctor" || !id) {
      setContext(null);
      return;
    }
    let cancelado = false;
    getAppointmentContext(id)
      .then((c) => !cancelado && setContext(c))
      // El historial es accesorio: si falla, desaparece esa línea y el resto
      // del diálogo se lee igual. No se muestra error.
      .catch(() => !cancelado && setContext(null));
    return () => {
      cancelado = true;
    };
  }, [open, role, id]);

  if (!appointment) return null;

  const { schedule, doctor, patient, status } = appointment;
  const office = schedule?.office;
  const persona = role === "patient" ? doctor : patient;

  // "Cómo llegar" no aporta en una cita de hace tres meses. El bloque Dónde se
  // queda —sirve para recordar a dónde se fue— pero sin el enlace.
  const esFutura = schedule
    ? new Date(`${schedule.date_of_service}T${schedule.end_time}`) >= new Date()
    : false;

  const edad = patient?.birth_date ? ageFrom(patient.birth_date) : null;
  const generoKey = patient?.gender ? GENDER_KEYS[patient.gender] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto overflow-x-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="sr-only">{t("detail.title")}</DialogTitle>
        </DialogHeader>

        {schedule && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">
                {format(parseISO(schedule.date_of_service), t("formats.dateLong"), {
                  locale: dateLocale,
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {schedule.start_time.slice(0, 5)} – {schedule.end_time.slice(0, 5)}
              </p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-medium",
                STATUS_COLORS[status] ?? "bg-gray-100 text-gray-600"
              )}
            >
              {STATUS_KEYS[status] ? t(STATUS_KEYS[status]) : status}
            </span>
          </div>
        )}

        {/* ── La persona ── */}
        {persona && (
          <div className="flex items-start gap-4 pt-1">
            <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full ring-4 ring-blue-50">
              <UserAvatar
                src={persona.profile_picture}
                name={persona.name}
                lastname={persona.lastname}
                width={80}
                height={80}
                className="h-20 w-20 object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-lg font-semibold text-gray-900">
                {role === "patient" ? "Dr. " : ""}
                {persona.name} {persona.lastname}
              </p>

              {role === "patient" && doctor && (
                <>
                  {doctor.specialties.length > 0 && (
                    <p className="flex items-center gap-1.5 text-sm text-blue-600">
                      <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                      {doctor.specialties.join(" · ")}
                    </p>
                  )}
                  {doctor.professional_card_number && (
                    <p className="text-xs text-gray-400">
                      {t("detail.professionalCard")}{" "}
                      <span className="font-mono">
                        {doctor.professional_card_number}
                      </span>
                    </p>
                  )}
                  {doctor.languages.length > 0 && (
                    <p className="text-xs text-gray-400">
                      {t("detail.speaks")} {doctor.languages.join(", ")}
                    </p>
                  )}
                </>
              )}

              {role === "doctor" && patient && (
                <p className="text-sm text-muted-foreground">
                  {[
                    edad !== null ? t("detail.years", { count: edad }) : null,
                    generoKey ? t(generoKey) : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Contacto del paciente, solo para el doctor ── */}
        {role === "doctor" && patient && (patient.phone_number || patient.email) && (
          <div className="space-y-2">
            {patient.phone_number && (
              <Row icon={Phone}>
                {/* En móvil, que es donde el doctor mira esto cinco minutos
                    antes, tocar el número debe llamar. */}
                <a href={`tel:${patient.phone_number}`} className="hover:underline">
                  {patient.phone_number}
                </a>
              </Row>
            )}
            {patient.email && (
              <Row icon={Mail}>
                <a href={`mailto:${patient.email}`} className="hover:underline">
                  {patient.email}
                </a>
              </Row>
            )}
          </div>
        )}

        {/* ── Historial, solo para el doctor y solo si llegó ── */}
        {role === "doctor" && context && (
          <Section title={t("detail.history")}>
            <p className="text-sm text-gray-600">
              {context.previous_count === 0
                ? t("detail.noVisitsWithYou")
                : context.previous_count === 1
                ? t("detail.oneVisitWithYou")
                : t("detail.visitsWithYou", { count: context.previous_count })}
              {context.last_visit && (
                <>
                  {" · "}
                  {t("detail.lastVisit", {
                    date: format(
                      parseISO(context.last_visit),
                      t("formats.dateLong"),
                      { locale: dateLocale }
                    ),
                  })}
                </>
              )}
            </p>
          </Section>
        )}

        {/* ── Dónde ── */}
        {office && (
          <Section title={t("detail.where")}>
            <div className="space-y-2">
              <p className="flex items-start gap-2 text-sm font-medium text-gray-900">
                <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                {office.name}
              </p>
              <p className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <span>
                  {office.address}
                  {(office.city_name || office.department_name) && (
                    <>
                      <br />
                      {[office.city_name, office.department_name]
                        .filter(Boolean)
                        .join(", ")}
                    </>
                  )}
                </span>
              </p>
              {office.phone_primary && (
                <Row icon={Phone}>
                  <a href={`tel:${office.phone_primary}`} className="hover:underline">
                    {office.phone_primary}
                  </a>
                </Row>
              )}
              {office.website_url && esFutura && (
                <a
                  href={office.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  {t("detail.directions")}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </Section>
        )}

        {/* ── Al perfil público, donde vive el detalle profundo ── */}
        {role === "patient" && doctor && (
          <Section title="">
            <a
              href={doctorProfileUrl(doctor.id)}
              className="group block rounded-lg border border-gray-100 p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/50"
            >
              <p className="flex items-center gap-1.5 text-sm font-medium text-blue-600">
                {t("detail.viewFullProfile")}
                <ExternalLink className="h-3.5 w-3.5" />
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                {t("detail.viewFullProfileHint")}
              </p>
            </a>
          </Section>
        )}

        {actions && <DialogFooter>{actions}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}
