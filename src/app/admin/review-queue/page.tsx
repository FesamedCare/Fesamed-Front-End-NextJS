"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { Loader2, Search, ChevronLeft, ChevronRight, User, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/i18n/LocaleProvider";

interface ReviewItem {
  profile_version_id: string;
  doctor_id: string;
  user_id: string;
  name: string;
  lastname: string;
  email: string;
  completion_percentage: number;
  status: string;
}

interface PageResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export default function ReviewQueuePage() {
  const { t } = useTranslation();
  const [data, setData] = useState<PageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), size: "10", sort: "-updated_at" });
      if (search.trim()) params.set("q", search.trim());
      const res = await apiClient<PageResponse>(`/api/v1/admin/review-queue/?${params}`);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar la cola");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(q);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("admin.reviewQueue")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("admin.queueSubtitle")}
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 max-w-md">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={t("admin.searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
        >
          {t("common.search")}
        </button>
      </form>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700 text-sm">
          {error}
          <button onClick={load} className="ml-3 underline">{t("common.retry")}</button>
        </div>
      ) : data?.items.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <User className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">{t("admin.queueEmpty")}</p>
          {search && <p className="text-sm mt-1">{t("admin.noSearchResults", { query: search })}</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-600">{t("admin.colDoctor")}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">{t("admin.colEmail")}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600 hidden sm:table-cell">{t("admin.colCompletion")}</th>
                <th className="text-left px-5 py-3 font-medium text-gray-600">{t("admin.colStatus")}</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.items.map((item) => (
                <tr key={item.profile_version_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{item.name} {item.lastname}</div>
                    <div className="text-xs text-gray-400 md:hidden">{item.email}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-600 hidden md:table-cell">{item.email}</td>
                  <td className="px-5 py-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${item.completion_percentage}%` }}
                        />
                      </div>
                      <span className="text-gray-600 text-xs">{item.completion_percentage}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 text-amber-700 text-xs px-2.5 py-1 font-medium">
                      <Clock className="h-3 w-3" />
                      {t("admin.statusUnderReview")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/admin/review-queue/${item.profile_version_id}`}
                      className="text-blue-600 hover:underline font-medium text-xs"
                    >
                      Revisar →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t bg-gray-50 text-sm text-gray-600">
              <span>
                {t("admin.pagination", { page: data.page, pages: data.pages, total: data.total })}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                  disabled={page === data.pages}
                  className="p-1 rounded hover:bg-gray-200 disabled:opacity-40"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
