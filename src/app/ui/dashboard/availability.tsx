"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isBefore,
  addMonths,
  subMonths,
  startOfToday,
  startOfWeek,
  addDays,
} from "date-fns";
import { es, enUS } from "date-fns/locale";
import Link from "next/link";
import { useTranslation } from "@/i18n/LocaleProvider";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Loader2,
  Clock,
  Building2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { TimePicker } from "@/components/TimePicker";
import {
  getMyScheduleRange,
  createSchedule,
  deleteSchedule,
  getMyOffices,
  getMyVerificationStatus,
  type DoctorScheduleSlot,
  type DoctorOfficeBasic,
} from "@/lib/schedule-api";



function formatTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

export function Disponibilidad() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? enUS : es;
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const [slots, setSlots] = useState<DoctorScheduleSlot[]>([]);
  const [offices, setOffices] = useState<DoctorOfficeBasic[]>([]);
  // null mientras carga o si la consulta falla: en ese caso no bloqueamos, el
  // backend sigue siendo el que manda. Bloquear por un error de red dejaría al
  // doctor sin poder crear horarios teniendo el perfil aprobado.
  const [approved, setApproved] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [addStart, setAddStart] = useState("08:00");
  const [addEnd, setAddEnd] = useState("09:00");
  const [addOffice, setAddOffice] = useState<string>("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const from = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const to = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const data = await getMyScheduleRange(from, to);
      setSlots(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("availability.loadError"));
    } finally {
      setLoading(false);
    }
  }, [currentMonth, t]);

  const loadOffices = useCallback(async () => {
    try {
      const data = await getMyOffices();
      setOffices(data);
    } catch {
      // fail silently
    }
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const loadApproval = useCallback(async () => {
    try {
      const data = await getMyVerificationStatus();
      setApproved(data.is_profile_approved);
    } catch {
      setApproved(null);
    }
  }, []);

  useEffect(() => {
    loadOffices();
  }, [loadOffices]);

  useEffect(() => {
    loadApproval();
  }, [loadApproval]);

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  // Las iniciales de los días salen del locale activo, no de una lista fija.
  // La semana arranca en lunes en ambos idiomas, que es como está dibujada
  // la grilla (el offset de abajo asume lunes en la primera columna).
  const weekdayLabels = useMemo(() => {
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) =>
      format(addDays(weekStart, i), "EEEEEE", { locale: dateLocale })
    );
  }, [dateLocale, today]);

  const firstDayOffset = useMemo(() => {
    const dayOfWeek = days[0]?.getDay() ?? 0;
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }, [days]);

  const slotsByDate = useMemo(() => {
    const map: Record<string, DoctorScheduleSlot[]> = {};
    for (const slot of slots) {
      const key = slot.date_of_service;
      if (!map[key]) map[key] = [];
      map[key].push(slot);
    }
    return map;
  }, [slots]);

  const selectedDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return slotsByDate[key] ?? [];
  }, [selectedDate, slotsByDate]);

  // Las dos condiciones que impiden crear un horario son del perfil, no del día:
  // por eso se avisan arriba y no dentro del panel del día seleccionado, que
  // sólo se ve después de hacer clic en el calendario.
  const missingOffices = offices.length === 0;
  const notApproved = approved === false;
  const isPastDay = !!selectedDate && isBefore(selectedDate, today);
  const canAddSlot = !missingOffices && !notApproved && !isPastDay;

  const openAddDialog = () => {
    setAddStart("08:00");
    setAddEnd("09:00");
    setAddOffice(offices[0]?.id ?? "");
    setAddError(null);
    setShowAdd(true);
  };

  const handleAddSlot = async () => {
    if (!selectedDate || !addOffice) return;
    setAddLoading(true);
    setAddError(null);
    try {
      await createSchedule({
        date_of_service: format(selectedDate, "yyyy-MM-dd"),
        start_time: addStart,
        end_time: addEnd,
        office_id: addOffice,
      });
      setShowAdd(false);
      await loadSlots();
    } catch (e) {
      setAddError(
        e instanceof Error ? e.message : t("availability.createError")
      );
    } finally {
      setAddLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setDeleteError(null);
    try {
      await deleteSchedule(id);
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : t("availability.deleteError")
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardContent className="pt-6">
          {notApproved && (
            <div className="mb-4 p-3 rounded-md bg-amber-50 text-amber-800 text-sm border border-amber-200">
              <p className="font-medium">
                {t("availability.notApprovedTitle")}
              </p>
              <p className="mt-0.5">
                {t("availability.notApprovedBody")}{" "}
                <Link href="/dashboard" className="underline font-medium">
                  {t("availability.notApprovedLink")}
                </Link>
              </p>
            </div>
          )}

          {missingOffices && (
            <div className="mb-4 p-3 rounded-md bg-amber-50 text-amber-800 text-sm border border-amber-200">
              <p className="font-medium">{t("availability.noOfficesTitle")}</p>
              <p className="mt-0.5">
                {t("availability.noOfficesBody")}{" "}
                <Link
                  href="/dashboard/edit-doctor-profile"
                  className="underline font-medium"
                >
                  {t("availability.noOfficesLink")}
                </Link>
              </p>
            </div>
          )}

          <div className="grid lg:grid-cols-[320px,1fr] gap-8">
            {/* ── Calendar ── */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="font-semibold text-gray-800 capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: dateLocale })}
                </span>
                <button
                  onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {weekdayLabels.map((d, i) => (
                  <div
                    key={`${i}-${d}`}
                    className="text-center text-xs font-medium text-gray-400 py-1 capitalize"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {loading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-y-1">
                  {Array.from({ length: firstDayOffset }).map((_, i) => (
                    <div key={`offset-${i}`} />
                  ))}
                  {days.map((day) => {
                    const key = format(day, "yyyy-MM-dd");
                    const daySlots = slotsByDate[key] ?? [];
                    const hasAvailable = daySlots.some((s) => !s.is_booked);
                    const hasBooked = daySlots.some((s) => s.is_booked);
                    const isSelected =
                      selectedDate && isSameDay(day, selectedDate);
                    const isToday = isSameDay(day, today);
                    const isPast = isBefore(day, today);

                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDate(day)}
                        disabled={isPast}
                        className={cn(
                          "flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors min-h-[44px]",
                          isPast
                            ? "text-gray-300 cursor-not-allowed"
                            : isSelected
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-100 text-gray-700",
                          isToday && !isSelected && "ring-2 ring-blue-300"
                        )}
                      >
                        <span className="text-sm font-medium leading-none mb-1">
                          {format(day, "d")}
                        </span>
                        <div className="flex gap-0.5 h-1.5">
                          {hasAvailable && (
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-white" : "bg-green-500"
                              )}
                            />
                          )}
                          {hasBooked && (
                            <div
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                isSelected ? "bg-blue-200" : "bg-orange-400"
                              )}
                            />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  {t("availability.legendAvailable")}
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-orange-400" />
                  {t("availability.legendBooked")}
                </div>
              </div>
            </div>

            {/* ── Day detail panel ── */}
            <div>
              {selectedDate ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-800 capitalize">
                      {format(selectedDate, t("formats.dayLong"), {
                        locale: dateLocale,
                      })}
                    </h3>
                    <Button
                      size="sm"
                      onClick={openAddDialog}
                      disabled={!canAddSlot}
                      title={
                        notApproved
                          ? t("availability.disabledNotApproved")
                          : missingOffices
                          ? t("availability.disabledNoOffices")
                          : isPastDay
                          ? t("availability.disabledPastDay")
                          : undefined
                      }
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t("common.add")}
                    </Button>
                  </div>

                  {deleteError && (
                    <div className="mb-3 p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">
                      {deleteError}
                    </div>
                  )}

                  {error && (
                    <div className="mb-3 p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200">
                      {error}
                    </div>
                  )}

                  {selectedDateSlots.length === 0 ? (
                    <div className="flex flex-col items-center py-10 text-muted-foreground">
                      <Clock className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm">{t("availability.emptyDayTitle")}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {t("availability.emptyDayHint")}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDateSlots.map((slot) => {
                        const office = offices.find(
                          (o) => o.id === slot.office_id
                        );
                        return (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-md bg-blue-50">
                                <Clock className="h-4 w-4 text-blue-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {formatTime(slot.start_time)} –{" "}
                                  {formatTime(slot.end_time)}
                                </p>
                                {office ? (
                                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                    <Building2 className="h-3 w-3" />
                                    {office.name}
                                  </p>
                                ) : (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    {t("availability.officeNotFound")}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-xs px-2.5 py-0.5 rounded-full font-medium",
                                  slot.is_booked
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-green-100 text-green-700"
                                )}
                              >
                                {slot.is_booked
                                  ? t("availability.legendBooked")
                                  : t("availability.legendAvailable")}
                              </span>
                              {!slot.is_booked && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                                  disabled={deletingId === slot.id}
                                  onClick={() => handleDelete(slot.id)}
                                >
                                  {deletingId === slot.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mb-3 opacity-20" />
                  <p className="text-sm">
                    {t("availability.noDaySelected")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Add Slot Dialog ── */}
      <Dialog open={showAdd} onOpenChange={(open) => !open && setShowAdd(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("availability.addDialogTitle")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {selectedDate && (
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                  {t("availability.fieldDate")}
                </Label>
                <p className="font-medium capitalize mt-0.5">
                  {format(selectedDate, t("formats.dayLongYear"), {
                    locale: dateLocale,
                  })}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <Label htmlFor="start-time" className="mb-1.5 block">{t("availability.fieldStartTime")}</Label>
                <TimePicker id="start-time" value={addStart} onChange={setAddStart} />
              </div>
              <div>
                <Label htmlFor="end-time" className="mb-1.5 block">{t("availability.fieldEndTime")}</Label>
                <TimePicker id="end-time" value={addEnd} onChange={setAddEnd} />
              </div>
            </div>

            <div>
              <Label htmlFor="office-select">{t("availability.fieldOffice")}</Label>
              <Select value={addOffice} onValueChange={setAddOffice}>
                <SelectTrigger id="office-select" className="mt-1">
                  <SelectValue placeholder={t("availability.officePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                      {o.address ? ` — ${o.address}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {addError && (
              <p className="text-sm text-destructive">{addError}</p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAdd(false)}
              disabled={addLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAddSlot}
              disabled={addLoading || !addOffice || !addStart || !addEnd}
            >
              {addLoading && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {t("availability.submitAdd")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
