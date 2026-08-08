"use client";

import { useState } from "react";
import { format, addWeeks, startOfToday } from "date-fns";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/LocaleProvider";
import {
  bulkDeleteSchedules,
  type BulkDeleteResult,
  type DoctorOfficeBasic,
} from "@/lib/schedule-api";

const WEEKDAY_LABELS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];
const TODOS = "__todos__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offices: DoctorOfficeBasic[];
  onCleared: (deleted: number) => void;
}

export function ClearRangeDialog({
  open,
  onOpenChange,
  offices,
  onCleared,
}: Props) {
  const { t } = useTranslation();
  const hoy = startOfToday();

  const [dateFrom, setDateFrom] = useState(format(hoy, "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(addWeeks(hoy, 8), "yyyy-MM-dd"));
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [officeId, setOfficeId] = useState(TODOS);

  const [preview, setPreview] = useState<BulkDeleteResult | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setPreview(null);
    setShowDetail(false);
    setError(null);
  };

  const run = async (dryRun: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const resultado = await bulkDeleteSchedules({
        date_from: dateFrom,
        date_to: dateTo,
        // Sin días marcados significa "todos": mandar la lista vacía
        // borraría nada, que no es lo que el doctor pidió.
        ...(weekdays.length > 0
          ? { weekdays: [...weekdays].sort((a, b) => a - b) }
          : {}),
        ...(officeId !== TODOS ? { office_id: officeId } : {}),
        dry_run: dryRun,
      });
      if (dryRun) {
        setPreview(resultado);
      } else {
        onCleared(resultado.deleted);
        onOpenChange(false);
        reset();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("pattern.deleteError"));
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
            <Trash2 className="h-5 w-5 text-red-500" />
            {t("pattern.deleteTitle")}
          </DialogTitle>
        </DialogHeader>

        {preview === null ? (
          <div className="space-y-5 py-2">
            <p className="text-sm text-muted-foreground">
              {t("pattern.deleteHint")}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="clear-from" className="mb-1.5 block">
                  {t("pattern.dateFrom")}
                </Label>
                <input
                  id="clear-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="clear-to" className="mb-1.5 block">
                  {t("pattern.dateTo")}
                </Label>
                <input
                  id="clear-to"
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">
                {t("pattern.days")}{" "}
                <span className="font-normal text-muted-foreground">
                  ({weekdays.length === 0 ? t("pattern.deleteAllDays") : ""})
                </span>
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAY_LABELS.map((label, day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setWeekdays((prev) =>
                        prev.includes(day)
                          ? prev.filter((d) => d !== day)
                          : [...prev, day]
                      )
                    }
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

            <div>
              <Label htmlFor="clear-office" className="mb-1.5 block">
                {t("availability.fieldOffice")}
              </Label>
              <Select value={officeId} onValueChange={setOfficeId}>
                <SelectTrigger id="clear-office">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODOS}>
                    {t("pattern.deleteAllOffices")}
                  </SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        ) : preview.deleted === 0 && preview.kept === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t("pattern.deleteEmpty")}
          </div>
        ) : (
          <div className="space-y-3 py-2">
            <div className="rounded-xl border border-red-200 bg-red-50/60 p-5">
              <p className="text-lg font-semibold text-gray-900">
                {t("pattern.deleteSummary", { count: preview.deleted })}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {t("pattern.summaryRange", { from: dateFrom, to: dateTo })}
              </p>
            </div>

            {preview.kept > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p>{t("pattern.deleteKept", { count: preview.kept })}</p>
                    <button
                      type="button"
                      onClick={() => setShowDetail((v) => !v)}
                      className="mt-1 underline hover:no-underline"
                    >
                      {showDetail
                        ? t("pattern.hideDetail")
                        : t("pattern.seeDetail")}
                    </button>
                    {showDetail && (
                      <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-xs">
                        {preview.kept_details.map((s, i) => (
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

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        <DialogFooter>
          {preview === null ? (
            <Button
              variant="destructive"
              onClick={() => run(true)}
              disabled={loading || dateFrom > dateTo}
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
                variant="destructive"
                onClick={() => run(false)}
                disabled={loading || preview.deleted === 0}
                className="rounded-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading
                  ? t("pattern.deleting")
                  : t("pattern.deleteConfirm", { count: preview.deleted })}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
