"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquareQuote } from "lucide-react";
import { RatingStars } from "@/components/RatingStars";
import { useTranslation } from "@/i18n/LocaleProvider";
import { getDoctorReviews } from "@/lib/doctors-api";
import type { PublicReview } from "@/app/types/types";

const PAGE_SIZE = 5;

/**
 * Opiniones publicadas en el perfil del especialista.
 *
 * Solo llegan las aprobadas por FesamedCare (o calificaciones sin texto), con
 * el autor como "Sofía C.". Sin reseñas no se muestra nada: una sección vacía
 * resta más de lo que aporta.
 */
export function DoctorReviews({ doctorId }: { doctorId: string }) {
  const { t, locale } = useTranslation();
  const [items, setItems] = useState<PublicReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getDoctorReviews(doctorId, page, PAGE_SIZE)
      .then((res) => {
        if (!alive) return;
        setItems((prev) => (page === 1 ? res.items : [...prev, ...res.items]));
        setTotal(res.total);
      })
      .catch(() => alive && setItems((prev) => prev))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [doctorId, page]);

  if (!loading && total === 0) return null;

  const dateFmt = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" });
  return (
    <section className="mt-6" aria-labelledby="doctor-reviews-title">
      <h3 id="doctor-reviews-title" className="mb-3 flex items-center gap-2 font-semibold">
        <MessageSquareQuote className="h-4 w-4 text-blue-500" aria-hidden />
        {t("reviews.title", { count: total })}
      </h3>
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <RatingStars value={r.rating} label={t("reviews.starsLabel", { n: r.rating })} />
              <span className="text-xs text-muted-foreground">{dateFmt.format(new Date(r.created_at))}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-gray-700">{r.comment}</p>}
            <p className="mt-2 text-xs font-medium text-gray-500">{r.author}</p>
          </li>
        ))}
      </ul>
      {loading && <Loader2 className="mx-auto mt-3 h-5 w-5 animate-spin text-blue-500" />}
      {!loading && items.length < total && (
        <button
          type="button"
          onClick={() => setPage((p) => p + 1)}
          className="mt-3 text-sm font-medium text-blue-600 hover:underline"
        >
          {t("reviews.showMore")}
        </button>
      )}
    </section>
  );
}
