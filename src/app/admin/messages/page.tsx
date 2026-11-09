"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Inbox, Loader2, Mail, Phone } from "lucide-react";
import { useTranslation } from "@/i18n/LocaleProvider";
import { apiClient } from "@/lib/api";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  phone: string | null;
  subject: string | null;
  budget: string | null;
  handled_at: string | null;
  created_at: string;
}

/**
 * Mensajes del formulario de contacto. La API los guarda siempre (aunque falle
 * el correo de aviso), así que este es el lugar donde no se pierden.
 */
export default function AdminMessagesPage() {
  const { t, locale } = useTranslation();
  const [handled, setHandled] = useState(false);
  const [items, setItems] = useState<ContactMessage[]>([]);
  const [counts, setCounts] = useState({ pending: 0, handled: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient<{ items: ContactMessage[]; pending: number; handled: number }>(
        `/api/v1/admin/contact-messages/?handled=${handled}`,
      );
      setItems(res.items);
      setCounts({ pending: res.pending, handled: res.handled });
    } finally {
      setLoading(false);
    }
  }, [handled]);

  useEffect(() => {
    load();
  }, [load]);

  const markHandled = async (id: string) => {
    setBusy(id);
    try {
      await apiClient(`/api/v1/admin/contact-messages/${id}/handled/`, { method: "POST" });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const fmt = (iso: string) => new Date(iso).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-gray-900">{t("contactAdmin.title")}</h1>
      <p className="mt-1 text-sm text-gray-500">{t("contactAdmin.subtitle")}</p>

      <div role="tablist" className="mt-6 inline-flex rounded-full bg-gray-100 p-1">
        {[false, true].map((h) => (
          <button
            key={String(h)}
            role="tab"
            aria-selected={handled === h}
            onClick={() => setHandled(h)}
            className={`rounded-full px-4 py-1.5 text-sm ${handled === h ? "bg-white font-medium text-blue-700 shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
          >
            {t(h ? "contactAdmin.tabHandled" : "contactAdmin.tabPending")}{" "}
            <span className="ml-1 text-xs text-gray-400">{h ? counts.handled : counts.pending}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {loading ? (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-500" />
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-sm text-gray-500">
            <Inbox className="h-6 w-6 text-gray-300" aria-hidden />
            {t("contactAdmin.empty")}
          </div>
        ) : (
          items.map((m) => (
            <article key={m.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{m.subject || t("contactAdmin.noSubject")}</p>
                  <p className="text-sm text-gray-600">{m.name}</p>
                </div>
                <span className="text-xs text-gray-400">{fmt(m.created_at)}</span>
              </div>
              <p className="mt-3 whitespace-pre-line text-gray-800">{m.message}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                  <Mail className="h-3.5 w-3.5" aria-hidden /> {m.email}
                </a>
                {m.phone && (
                  <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 text-blue-600 hover:underline">
                    <Phone className="h-3.5 w-3.5" aria-hidden /> {m.phone}
                  </a>
                )}
                {m.budget && <span className="text-gray-500">{t("contactAdmin.budget")} {m.budget}</span>}
              </div>
              {!m.handled_at && (
                <button
                  onClick={() => markHandled(m.id)}
                  disabled={busy === m.id}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy === m.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {t("contactAdmin.markHandled")}
                </button>
              )}
            </article>
          ))
        )}
      </div>
    </div>
  );
}
