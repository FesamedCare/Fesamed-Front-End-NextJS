"use client";

import { useMemo, useState } from "react";
import { format, addWeeks, startOfToday } from "date-fns";
import { AlertTriangle, CalendarRange, Loader2, Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TimePicker } from "@/components/TimePicker";
import { cn } from "@/lib/utils";
import { useTranslation, type TranslationKey } from "@/i18n/LocaleProvider";
import {
  WEEKDAY_PRESETS,
  countSlots,
  leftoverMinutes,
  matchesPreset,
  type PatternBlock,
  type PresetName,
} from "@/lib/schedulePattern";
import {
  bulkCreateSchedules,
  type BulkScheduleResult,
  type DoctorOfficeBasic,
} from "@/lib/schedule-api";

const SLOT_OPTIONS = [15, 20, 30, 45, 60];

/** 0 = lunes … 6 = domingo. Coincide con el backend y con `date.weekday()`. */
const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

const PRESETS: { name: PresetName; labelKey: TranslationKey }[] = [
  { name: "weekdays", labelKey: "pattern.presetWeekdays" },
  { name: "monToSat", labelKey: "pattern.presetMonToSat" },
  { name: "weekend", labelKey: "pattern.presetWeekend" },
];

const PILL =
  "rounded-full px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offices: DoctorOfficeBasic[];
  /** Se llama tras publicar, para que la pantalla recargue el calendario. */
  onPublished: (created: number) => void;
}

export function RecurringScheduleDialog({
  open,
  onOpenChange,
  offices,
  onPublished,
}: Props) {
  const { t } = useTranslation();
  const hoy = startOfToday();

  const [weekdays, setWeekdays] = useState<number[]>([...WEEKDAY_PRESETS.weekdays]);
  const [blocks, setBlocks] = useState<PatternBlock[]>([
    { start: "08:00", end: "12:00" },
  ]);
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [dateFrom, setDateFrom] = useState(format(hoy, "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(addWeeks(hoy, 8), "yyyy-MM-dd"));
  const [officeId, setOfficeId] = useState(offices[0]?.id ?? "");

  const [preview, setPreview] = useState<BulkScheduleResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const perDay = countSlots(blocks, slotMinutes);
  const leftover = leftoverMinutes(blocks, slotMinutes);

  const blocksValid = blocks.every((b) => b.start < b.end);
  const canReview =
    weekdays.length > 0 && blocksValid && perDay > 0 && !!officeId && dateFrom <= dateTo;

  const payload = useMemo(
    () => ({
      weekdays: [...weekdays].sort((a, b) => a - b),
      blocks: blocks.map((b) => ({ start_time: b.start, end_time: b.end })),
      slot_minutes: slotMinutes,
      date_from: dateFrom,
      date_to: dateTo,
      office_id: officeId,
    }),
    [weekdays, blocks, slotMinutes, dateFrom, dateTo, officeId]
  );

  const toggleDay = (day: number) =>
    setWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const reset = () => {
    setPreview(null);
    setShowDetail(false);
    setError(null);
  };

  const run = async (dryRun: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await bulkCreateSchedules({ ...payload, dry_run: dryRun });
      if (dryRun) {
        setPreview(resultado);
      } else {
        onPublished(resultado.created);
        onOpenChange(false);
        reset();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("pattern.createError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-blue-500" />
            {t("pattern.title")}
          </DialogTitle>
        </DialogHeader>

        {preview === null ? (
          <div className="space-y-5 py-2">
            {/* ── Días ── */}
            <div>
              <Label className="mb-2 block">{t("pattern.days")}</Label>
              <div className="mb-2 flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setWeekdays([...WEEKDAY_PRESETS[p.name]])}
                    className={cn(
                      PILL,
                      "border",
                      matchesPreset(weekdays, p.name)
                        ? "border-blue-500 bg-blue-50 font-medium text-blue-700"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {t(p.labelKey)}
                  </button>
                ))}
              </div>
              {/*
                Los días sueltos quedan debajo de los atajos: un doctor que
                atiende martes y jueves no entra en ningún atajo.
              */}
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    aria-pressed={weekdays.includes(day)}
                    className={cn(
                      "h-9 w-9 rounded-full text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                      weekdays.includes(day)
                        ? "bg-blue-500 font-medium text-white"
                        : "border border-gray-200 text-gray-500 hover:border-gray-300"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Franjas ── */}
            <div>
              <Label className="mb-2 block">{t("pattern.blocks")}</Label>
              <div className="space-y-2">
                {blocks.map((block, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <TimePicker
                      value={block.start}
                      onChange={(v) =>
                        setBlocks((prev) =>
                          prev.map((b, j) => (j === i ? { ...b, start: v } : b))
                        )
                      }
                    />
                    <span className="text-gray-400">→</span>
                    <TimePicker
                      value={block.end}
                      onChange={(v) =>
                        setBlocks((prev) =>
                          prev.map((b, j) => (j === i ? { ...b, end: v } : b))
                        )
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("pattern.removeBlock")}
                      disabled={blocks.length === 1}
                      onClick={() =>
                        setBlocks((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="h-8 w-8 shrink-0 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() =>
                  setBlocks((prev) => [...prev, { start: "14:00", end: "17:00" }])
                }
                className="mt-1 rounded-full text-blue-600"
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {t("pattern.addBlock")}
              </Button>
              {!blocksValid && (
                <p className="mt-1 text-xs text-destructive">
                  {t("pattern.invalidBlock")}
                </p>
              )}
            </div>

            {/* ── Duración ── */}
            <div>
              <Label className="mb-2 block">{t("pattern.duration")}</Label>
              <div className="inline-flex flex-wrap gap-1 rounded-full bg-gray-100 p-1">
                {SLOT_OPTIONS.map((min) => (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setSlotMinutes(min)}
                    aria-pressed={slotMinutes === min}
                    className={cn(
                      PILL,
                      slotMinutes === min
                        ? "bg-white font-semibold text-blue-700 shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    )}
                  >
                    {min} {t("pattern.minutesShort")}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Rango y consultorio ── */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="pattern-from" className="mb-1.5 block">
                  {t("pattern.dateFrom")}
                </Label>
                <input
                  id="pattern-from"
                  type="date"
                  value={dateFrom}
                  min={format(hoy, "yyyy-MM-dd")}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="pattern-to" className="mb-1.5 block">
                  {t("pattern.dateTo")}
                </Label>
                <input
                  id="pattern-to"
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="pattern-office" className="mb-1.5 block">
                {t("availability.fieldOffice")}
              </Label>
              <Select value={officeId} onValueChange={setOfficeId}>
                <SelectTrigger id="pattern-office">
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

            {/* Anticipo local: orienta mientras se escribe. El resumen real
                lo da el servidor, que además conoce las colisiones. */}
            {perDay > 0 && (
              <p className="text-sm text-muted-foreground">
                {t("pattern.summaryPerDay", { perDay })}
              </p>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : (
          <PreviewPanel
            preview={preview}
            perDay={perDay}
            leftover={leftover}
            dateFrom={dateFrom}
            dateTo={dateTo}
            showDetail={showDetail}
            onToggleDetail={() => setShowDetail((v) => !v)}
            error={error}
          />
        )}

        <DialogFooter>
          {preview === null ? (
            <Button
              onClick={() => run(true)}
              disabled={!canReview || loading}
              className="rounded-full"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("pattern.review")}
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={reset}
                disabled={loading}
                className="rounded-full"
              >
                {t("pattern.back")}
              </Button>
              <Button
                onClick={() => run(false)}
                disabled={loading || preview.created === 0}
                className="rounded-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading
                  ? t("pattern.publishing")
                  : t("pattern.publishCount", { count: preview.created })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PreviewPanel({
  preview,
  perDay,
  leftover,
  dateFrom,
  dateTo,
  showDetail,
  onToggleDetail,
  error,
}: {
  preview: BulkScheduleResult;
  perDay: number;
  leftover: number;
  dateFrom: string;
  dateTo: string;
  showDetail: boolean;
  onToggleDetail: () => void;
  error: string | null;
}) {
  const { t } = useTranslation();
  const total = preview.created + preview.skipped;
  const days = perDay > 0 ? Math.round(total / perDay) : 0;

  if (preview.created === 0 && preview.skipped === 0) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        {t("pattern.summaryEmpty")}
      </div>
    );
  }

  return (
    <div className="space-y-3 py-2">
      <div className="rounded-xl border border-blue-200 bg-gradient-to-b from-blue-50/60 to-white p-5">
        <p className="text-lg font-semibold text-gray-900">
          {t("pattern.summaryTotal", { count: preview.created, days })}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {t("pattern.summaryPerDay", { perDay })} ·{" "}
          {t("pattern.summaryRange", { from: dateFrom, to: dateTo })}
        </p>
      </div>

      {preview.skipped > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p>{t("pattern.summarySkipped", { count: preview.skipped })}</p>
              <button
                type="button"
                onClick={onToggleDetail}
                className="mt-1 underline hover:no-underline"
              >
                {showDetail ? t("pattern.hideDetail") : t("pattern.seeDetail")}
              </button>
              {showDetail && (
                <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-xs">
                  {preview.skipped_details.map((s, i) => (
                    <li key={i}>
                      {s.date_of_service} · {s.start_time.slice(0, 5)}–
                      {s.end_time.slice(0, 5)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Solo aparece cuando de verdad sobra algo: con turnos de 30 min sobre
          franjas de 4 h no sobra nada y el aviso seria ruido. */}
      {leftover > 0 && (
        <p className="text-xs text-muted-foreground">
          {t("pattern.summaryLeftover", { minutes: leftover })}
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
