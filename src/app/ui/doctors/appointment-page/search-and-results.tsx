"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Loader2, MapPin, Stethoscope, Info } from "lucide-react";
import { useTranslation } from "@/i18n/LocaleProvider";
import { DoctorSearchBar } from "./doctor-search-bar";
import { RatingSummary } from "@/components/RatingStars";
import {
  searchDoctors,
  getCities,
  getDepartments,
  getSpecialties,
  type SearchDoctorsParams,
} from "@/lib/doctors-api";
import { SPECIALTY_PARAM, findSpecialtyByName } from "@/lib/specialtySearchUrl";
import type {
  DoctorSearchResult,
  CatalogCity,
  CatalogDepartment,
  CatalogSpecialty,
} from "@/app/types/types";

/** Píxeles que el título sube mientras se desvanece. */
const HEADING_LIFT = 10;

interface SearchAndResultsProps {
  onSelectDoctor: (doctorId: string) => void;
}

export function SearchAndResults({ onSelectDoctor }: SearchAndResultsProps) {
  const { t, locale } = useTranslation();
  const [q, setQ] = useState("");
  const [cityId, setCityId] = useState<string>("");
  const [specialtyId, setSpecialtyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchRan, setSearchRan] = useState(true);
  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState<CatalogCity[]>([]);
  const [departments, setDepartments] = useState<CatalogDepartment[]>([]);
  const [specialties, setSpecialties] = useState<CatalogSpecialty[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  // Especialidad que llega desde los accesos del inicio (?especialidad=Odontólogo).
  const specialtyParam = useSearchParams().get(SPECIALTY_PARAM);
  // Evita repetir la carga inicial cuando el catálogo termina de llegar.
  const initialLoadFor = useRef<string | null | undefined>(undefined);

  // El título se desvanece con el scroll y llega a 0 justo cuando su borde
  // toca la navbar: antes, el fondo blanco de la navbar lo cortaba a la mitad.
  // Se mide la navbar real porque en celular es más baja que en escritorio.
  const headingRef = useRef<HTMLDivElement>(null);
  const [headingFadeEnd, setHeadingFadeEnd] = useState(80);
  useEffect(() => {
    const measure = () => {
      const heading = headingRef.current;
      if (!heading) return;
      const navHeight = document.getElementById("navbar")?.getBoundingClientRect().height ?? 96;
      const top = heading.getBoundingClientRect().top + window.scrollY;
      // Se descuenta lo que el título sube por su cuenta (HEADING_LIFT) y un
      // margen, para que ya sea invisible antes de tocar la navbar.
      setHeadingFadeEnd(Math.max(16, top - navHeight - HEADING_LIFT - 6));
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const { scrollY } = useScroll();
  const headingOpacity = useTransform(scrollY, [0, headingFadeEnd], [1, 0]);
  const headingLift = useTransform(scrollY, [0, headingFadeEnd], [0, -HEADING_LIFT]);
  const headingScale = useTransform(scrollY, [0, headingFadeEnd], [1, 0.97]);

  const loadCatalogs = useCallback(async () => {
    setCatalogLoading(true);
    try {
      const [c, d, s] = await Promise.all([
        getCities(),
        getDepartments(),
        getSpecialties(),
      ]);
      setCities(Array.isArray(c) ? c : []);
      setDepartments(Array.isArray(d) ? d : []);
      setSpecialties(Array.isArray(s) ? s : []);
    } catch (e) {
      console.error("Error loading catalogs:", e);
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCatalogs();
  }, [loadCatalogs]);

  // Al entrar, cargar los doctores: todos, o los de la especialidad de la URL.
  useEffect(() => {
    // Con especialidad en la URL hay que esperar el catálogo para pasar el
    // nombre a su id; sin ella se carga de una vez.
    if (specialtyParam && catalogLoading) return;
    if (initialLoadFor.current === specialtyParam) return;
    initialLoadFor.current = specialtyParam;

    const params: SearchDoctorsParams = { page: 1, size: 100 };
    if (specialtyParam) {
      const match = findSpecialtyByName(specialties, specialtyParam);
      if (match) {
        params.specialty_id = match.id;
        setSpecialtyId(match.id);
      }
    }

    // No se cancela al volver a ejecutarse el efecto (pasa cuando llega el
    // catálogo): eso descartaría esta carga y la siguiente ejecución no busca.
    // Solo se ignora la respuesta si ya hay una carga inicial más reciente.
    const requestFor = specialtyParam;
    const isCurrent = () => initialLoadFor.current === requestFor;
    setLoading(true);
    searchDoctors(params)
      .then((data) => {
        if (!isCurrent()) return;
        const list = Array.isArray(data.items)
          ? data.items
          : (data as { results?: DoctorSearchResult[] }).results ?? [];
        setDoctors(list);
        setTotal(typeof data.total === "number" ? data.total : 0);
      })
      .catch((e) => {
        if (isCurrent()) {
          setDoctors([]);
          setTotal(0);
        }
        console.error("Error cargando doctores:", e);
      })
      .finally(() => {
        if (isCurrent()) setLoading(false);
      });
  }, [specialtyParam, catalogLoading, specialties]);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setSearchRan(true);
    try {
      const params: SearchDoctorsParams = {
        page: 1,
        size: 24,
      };
      if (q.trim()) params.q = q.trim();
      if (cityId) params.city_id = cityId;
      if (specialtyId) params.specialty_id = specialtyId;
      const data = await searchDoctors(params);
      const list = Array.isArray(data.items) ? data.items : (data as { results?: DoctorSearchResult[] }).results ?? [];
      setDoctors(list);
      setTotal(typeof data.total === "number" ? data.total : 0);
    } catch (e) {
      console.error("Search error:", e);
      setDoctors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [q, cityId, specialtyId]);

  return (
    <div className="container mx-auto xl:px-16 px-6 2xl:px-0 sm:px-16 py-4 md:py-6 lg:pb-32">
      <div className="mb-10">
        <motion.div
          ref={headingRef}
          style={{ opacity: headingOpacity, y: headingLift, scale: headingScale }}
        >
          <h1 className="text-3xl font-semibold text-center mb-2 text-gray-900">
            {t("search.title")}
          </h1>
          <p className="text-center text-muted-foreground text-sm mb-6">
            {t("search.subtitle")}
          </p>
        </motion.div>
        <DoctorSearchBar
          cities={cities}
          departments={departments}
          specialties={specialties}
          cityId={cityId}
          specialtyId={specialtyId}
          q={q}
          onCityChange={setCityId}
          onSpecialtyChange={setSpecialtyId}
          onQueryChange={setQ}
          onSubmit={runSearch}
          loading={loading}
          disabled={catalogLoading}
        />
      </div>

      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">
              {t("search.emptyTitle")}
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {t("search.emptyBody")}
            </p>
          </div>
        ) : (
            <>
              <p className="text-muted-foreground mb-4">
                {total === 1
                  ? t("search.resultsOne", { count: total })
                  : t("search.resultsMany", { count: total })}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {doctors.map((doc) => (
                  <Card
                    key={doc.doctor_id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => onSelectDoctor(doc.doctor_id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="relative w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-muted">
                          <UserAvatar
                            src={doc.profile_picture}
                            name={doc.full_name}
                            alt={doc.full_name}
                            fill
                            sizes="80px"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 truncate">{doc.full_name}</h3>
                          {(doc.rating_count ?? 0) > 0 && doc.rating_average != null && (
                            <RatingSummary
                              average={doc.rating_average}
                              count={doc.rating_count ?? 0}
                              locale={locale}
                              countLabel={String(doc.rating_count)}
                            />
                          )}
                          <div className="flex items-center gap-1 text-sm text-blue-600 mt-0.5">
                            <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">
                              {doc.specialties.length ? doc.specialties.join(", ") : "—"}
                            </span>
                          </div>
                          {doc.cities?.length > 0 && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{doc.cities.slice(0, 2).join(", ")}</span>
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="default"
                            size="sm"
                            className="mt-3 w-full rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectDoctor(doc.doctor_id);
                            }}
                          >
                            {t("search.viewAndBook")}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
      </div>

      <div className="max-w-6xl mx-auto mt-8 px-2">
        <div className="flex gap-2 items-start rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground">
          <Info className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-medium text-foreground">{t("search.requirementsTitle")}</span>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>{t("search.requirement1")}</li>
              <li>{t("search.requirement2")}</li>
              <li>{t("search.requirement3")}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
