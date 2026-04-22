"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/UserAvatar";
import { Search, Loader2, MapPin, Stethoscope, Info } from "lucide-react";
import {
  searchDoctors,
  getCities,
  getDepartments,
  getSpecialties,
  type SearchDoctorsParams,
} from "@/lib/doctors-api";
import type {
  DoctorSearchResult,
  CatalogCity,
  CatalogDepartment,
  CatalogSpecialty,
} from "@/app/types/types";

interface SearchAndResultsProps {
  onSelectDoctor: (doctorId: string) => void;
}

export function SearchAndResults({ onSelectDoctor }: SearchAndResultsProps) {
  const [q, setQ] = useState("");
  const [cityId, setCityId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [specialtyId, setSpecialtyId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [searchRan, setSearchRan] = useState(true);
  const [doctors, setDoctors] = useState<DoctorSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [cities, setCities] = useState<CatalogCity[]>([]);
  const [departments, setDepartments] = useState<CatalogDepartment[]>([]);
  const [specialties, setSpecialties] = useState<CatalogSpecialty[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);

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

  // Al entrar, cargar todos los doctores disponibles (sin filtros)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    searchDoctors({ page: 1, size: 100 })
      .then((data) => {
        if (cancelled) return;
        const list = Array.isArray(data.items)
          ? data.items
          : (data as { results?: DoctorSearchResult[] }).results ?? [];
        setDoctors(list);
        setTotal(typeof data.total === "number" ? data.total : 0);
      })
      .catch((e) => {
        if (!cancelled) {
          setDoctors([]);
          setTotal(0);
        }
        console.error("Error cargando doctores:", e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
      if (departmentId) params.department_id = departmentId;
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
  }, [q, cityId, departmentId, specialtyId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch();
  };

  return (
    <div className="container mx-auto xl:px-16 px-6 2xl:px-0 sm:px-16 py-4 md:py-6 lg:pb-32">
      <form onSubmit={handleSubmit} className="mb-6">
        <h1 className="text-3xl font-semibold text-center mb-2 text-gray-900">
          Busca un doctor y agenda tu cita
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-6">
          Solo se muestran doctores con perfil verificado por Fesamed.
        </p>
        <div className="max-w-4xl mx-auto flex flex-col gap-4 md:flex-row md:items-end md:flex-wrap">
          <Select value={departmentId || "all"} onValueChange={(v) => setDepartmentId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full md:w-[180px] bg-white rounded-full border-blue-500 text-blue-600">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={cityId || "all"} onValueChange={(v) => setCityId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full md:w-[180px] bg-white rounded-full border-blue-500 text-blue-600">
              <SelectValue placeholder="Ciudad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ciudades</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={specialtyId || "all"} onValueChange={(v) => setSpecialtyId(v === "all" ? "" : v)}>
            <SelectTrigger className="w-full md:w-[200px] bg-white rounded-full border-blue-500 text-blue-600">
              <SelectValue placeholder="Especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las especialidades</SelectItem>
              {specialties.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Nombre o especialización"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 rounded-full bg-gray-50 border-blue-500/30"
            />
          </div>
          <Button type="submit" className="rounded-full" disabled={catalogLoading || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Buscando...
              </>
            ) : (
              "Buscar"
            )}
          </Button>
        </div>
      </form>

      <div className="max-w-6xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <p className="text-muted-foreground">
              No hay doctores disponibles para mostrar.
            </p>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Solo aparecen perfiles de doctores que han sido aprobados por Fesamed. Si aplicaste filtros, prueba sin ellos para ver todos. Si eres doctor y no te ves, revisa que tu perfil esté enviado a verificación y aprobado.
            </p>
          </div>
        ) : (
            <>
              <p className="text-muted-foreground mb-4">
                {total} doctor{total !== 1 ? "es" : ""} encontrado{total !== 1 ? "s" : ""}
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
                            Ver perfil y agendar
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
            <span className="font-medium text-foreground">Requisitos para aparecer en la búsqueda:</span>
            <ul className="mt-2 list-disc list-inside space-y-1">
              <li>Cuenta con rol de doctor en Fesamed.</li>
              <li>Perfil completado y enviado a verificación.</li>
              <li>Perfil aprobado por Fesamed (revisión por el equipo).</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
