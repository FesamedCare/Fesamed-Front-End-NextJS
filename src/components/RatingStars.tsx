import { Star } from "lucide-react";

/** Estrellas de 1 a 5 (solo lectura). */
export function RatingStars({ value, size = "sm", label }: { value: number; size?: "sm" | "md"; label?: string }) {
  const cls = size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={label ?? `${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden
          className={`${cls} ${i <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}`}
        />
      ))}
    </span>
  );
}

/** "★ 4,8 (12)": promedio con un decimal en el formato del idioma. */
export function RatingSummary({
  average,
  count,
  locale,
  countLabel,
}: {
  average: number;
  count: number;
  locale: string;
  countLabel: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
      <span className="font-semibold text-gray-900">
        {average.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
      </span>
      <span className="text-muted-foreground">({countLabel || count})</span>
    </span>
  );
}
