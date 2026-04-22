"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimePickerProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  id?: string;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${pad(h)}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${pad(h - 12)}:00 PM`;
}

export function TimePicker({ value, onChange, id }: TimePickerProps) {
  const [hStr, mStr] = value.split(":");
  const currentHour = parseInt(hStr ?? "8", 10);
  const rawMinute = parseInt(mStr ?? "0", 10);
  const currentMinute = MINUTES.includes(rawMinute)
    ? rawMinute
    : MINUTES.reduce((p, c) => (Math.abs(c - rawMinute) < Math.abs(p - rawMinute) ? c : p));

  return (
    <div id={id} className="flex items-center gap-2">
      <Select
        value={pad(currentHour)}
        onValueChange={(h) => onChange(`${h}:${pad(currentMinute)}`)}
      >
        <SelectTrigger className="flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          {HOURS.map((h) => (
            <SelectItem key={h} value={pad(h)}>
              {formatHour(h)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={pad(currentMinute)}
        onValueChange={(m) => onChange(`${pad(currentHour)}:${m}`)}
      >
        <SelectTrigger className="w-24">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MINUTES.map((m) => (
            <SelectItem key={m} value={pad(m)}>
              {pad(m)} min
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
