"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Loader2, MapPin, Navigation, Search, Stethoscope, X } from "lucide-react";
import { useTranslation } from "@/i18n/LocaleProvider";
import type { CatalogCity, CatalogDepartment, CatalogSpecialty } from "@/app/types/types";
import {
  FEATURED_CITIES,
  FEATURED_SPECIALTIES,
  cityVisual,
  normalizeName,
  specialtyVisual,
  type CatalogVisual,
} from "./search-catalog-icons";
import { MagneticButton } from "@/components/MagneticButton";
import { useSearchDock } from "@/contexts/SearchDockContext";
import { morphFrom } from "@/lib/morph";

type Panel = "city" | "specialty" | null;

interface DoctorSearchBarProps {
  cities: CatalogCity[];
  departments: CatalogDepartment[];
  specialties: CatalogSpecialty[];
  cityId: string;
  specialtyId: string;
  q: string;
  onCityChange: (id: string) => void;
  onSpecialtyChange: (id: string) => void;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
  disabled: boolean;
}

const MAX_MATCHES = 8;

/**
 * La navbar de escritorio mide ~96 px. La barra se acopla cuando su borde
 * superior pasa por debajo de ella y se desacopla al volver; los dos umbrales
 * distintos evitan que parpadee si el scroll se detiene justo en el borde.
 */
const DOCK_AT = 80;
const UNDOCK_AT = 100;

/** Solo hay píldora compacta donde la navbar de escritorio tiene espacio. */
function useIsDesktop() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return desktop;
}

/**
 * Barra de búsqueda de doctores en tres tramos: dónde, especialidad y texto
 * libre. Las ciudades y especialidades se eligen en un panel con sugerencias e
 * íconos, y cada panel tiene su propio buscador para llegar a las ~1.100
 * ciudades y ~100 especialidades del catálogo sin una lista interminable.
 *
 * El filtro de departamento se quitó: la ciudad ya lo implica y liberaba
 * espacio para el campo de texto.
 */
export function DoctorSearchBar({
  cities,
  departments,
  specialties,
  cityId,
  specialtyId,
  q,
  onCityChange,
  onSpecialtyChange,
  onQueryChange,
  onSubmit,
  loading,
  disabled,
}: DoctorSearchBarProps) {
  const { t } = useTranslation();
  const [panel, setPanel] = useState<Panel>(null);
  const [cityFilter, setCityFilter] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const queryRef = useRef<HTMLInputElement>(null);
  const isDesktop = useIsDesktop();
  const reduceMotion = useReducedMotion();
  const [docked, setDocked] = useState(false);
  const dockedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  // Panel que hay que abrir cuando la barra termine de volver a su sitio.
  const pendingPanel = useRef<Panel>(null);
  const { setDockState, setExpandHandler, lastRect, pillEl, dockProgress } = useSearchDock();

  // Acoplar al hacer scroll. Se mide el contenedor, que conserva su alto aunque
  // la barra esté en la navbar, así la página no salta al acoplar.
  useEffect(() => {
    const apply = (next: boolean) => {
      if (next === dockedRef.current) return;
      // Antes de cambiar, el elemento que va a desaparecer deja su rectángulo
      // para que el que aparece arranque desde ahí.
      const leaving = next ? formRef.current : pillEl.current;
      lastRect.current = leaving ? leaving.getBoundingClientRect() : null;
      dockedRef.current = next;
      setDocked(next);
    };
    if (!isDesktop) {
      apply(false);
      dockProgress.set(0);
      return;
    }
    let frame = 0;
    const measure = () => {
      frame = 0;
      const rect = rootRef.current?.getBoundingClientRect();
      const top = rect?.top ?? Infinity;
      // Recorrido hacia la navbar: distancia ya bajada sobre la distancia
      // total hasta el punto de acople, entre 0 y 1.
      const travel = rect ? rect.top + window.scrollY - DOCK_AT : 0;
      dockProgress.set(travel > 0 ? Math.min(1, Math.max(0, window.scrollY / travel)) : 0);
      apply(dockedRef.current ? top < UNDOCK_AT : top < DOCK_AT);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [isDesktop, lastRect, pillEl, dockProgress]);

  // Al volver de la navbar, la barra arranca con la forma de la píldora.
  useLayoutEffect(() => {
    if (docked || !lastRect.current || !formRef.current) return;
    morphFrom(formRef.current, lastRect.current);
    lastRect.current = null;
  }, [docked, lastRect]);

  // Al acoplar se cierran los paneles; al volver, se abre el pendiente.
  useEffect(() => {
    if (docked) {
      setPanel(null);
    } else if (pendingPanel.current) {
      setPanel(pendingPanel.current);
      pendingPanel.current = null;
    }
  }, [docked]);

  // La píldora compacta, al pulsarla, sube la página y abre "Dónde".
  useEffect(() => {
    setExpandHandler(() => {
      pendingPanel.current = "city";
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
    return () => setExpandHandler(null);
  }, [setExpandHandler, reduceMotion]);

  // Cerrar al hacer clic fuera o con Escape.
  useEffect(() => {
    if (!panel) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setPanel(null);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel(null);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [panel]);

  // Subtítulo de cada ciudad: su departamento. Si coincide con el nombre de la
  // ciudad (Bogotá, D.C.), se dice "Distrito Capital" para no repetirlo.
  const citySubtitle = useMemo(() => {
    const map = new Map(departments.map((d) => [d.id, d.name]));
    return (city: CatalogCity) => {
      const dept = map.get(city.department_id) ?? "";
      return normalizeName(dept) === normalizeName(city.name) ? t("search.capitalDistrict") : dept;
    };
  }, [departments, t]);

  const selectedCity = cities.find((c) => c.id === cityId);
  const selectedSpecialty = specialties.find((s) => s.id === specialtyId);

  useEffect(() => {
    setDockState({
      available: isDesktop,
      docked,
      summary: { where: selectedCity?.name ?? "", specialty: selectedSpecialty?.name ?? "", query: q.trim() },
    });
  }, [setDockState, isDesktop, docked, selectedCity, selectedSpecialty, q]);

  useEffect(
    () => () => {
      setDockState({ available: false, docked: false, summary: { where: "", specialty: "", query: "" } });
      dockProgress.set(0);
    },
    [setDockState, dockProgress],
  );

  const featuredCities = useMemo(
    () =>
      FEATURED_CITIES.map((f) => ({
        city: cities.find((c) => normalizeName(c.name) === normalizeName(f.name)),
        visual: f.visual,
      })).filter((x): x is { city: CatalogCity; visual: CatalogVisual } => Boolean(x.city)),
    [cities],
  );

  const featuredSpecialties = useMemo(
    () =>
      FEATURED_SPECIALTIES.map((f) => ({
        specialty: specialties.find((s) => normalizeName(s.name) === normalizeName(f.name)),
        visual: f.visual,
      })).filter((x): x is { specialty: CatalogSpecialty; visual: CatalogVisual } => Boolean(x.specialty)),
    [specialties],
  );

  const cityMatches = useMemo(() => {
    const term = normalizeName(cityFilter);
    if (!term) return [];
    return cities.filter((c) => normalizeName(c.name).includes(term)).slice(0, MAX_MATCHES);
  }, [cities, cityFilter]);

  const specialtyMatches = useMemo(() => {
    const term = normalizeName(specialtyFilter);
    if (!term) return [];
    return specialties.filter((s) => normalizeName(s.name).includes(term)).slice(0, MAX_MATCHES);
  }, [specialties, specialtyFilter]);

  const pickCity = (id: string) => {
    onCityChange(id);
    setCityFilter("");
    // Igual que en la referencia: al elegir, se pasa al siguiente tramo.
    setPanel("specialty");
  };

  const pickSpecialty = (id: string) => {
    onSpecialtyChange(id);
    setSpecialtyFilter("");
    setPanel(null);
    queryRef.current?.focus();
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setPanel(null);
    onSubmit();
  };

  const segment = (active: boolean) =>
    `group relative flex-1 min-w-0 flex items-center px-6 py-3 md:py-0 md:h-full rounded-2xl md:rounded-full transition-colors ${
      active ? "bg-white shadow-lg" : "hover:bg-gray-100"
    }`;

  return (
    <div ref={rootRef} className="relative max-w-4xl mx-auto md:min-h-16">
      {/* Acoplada: la barra vive en la navbar y aquí queda solo su hueco. */}
      {!docked && (
      <motion.form
        ref={formRef}
        onSubmit={submit}
        role="search"
        className={`mx-auto rounded-3xl md:rounded-full border border-gray-200 shadow-md transition-colors ${
          panel ? "bg-gray-100" : "bg-white"
        }`}
      >
        {/* El contenido entra un instante después, cuando la píldora ya creció:
            así no se ve el texto estirado mientras cambia de tamaño. */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.18, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-center md:h-16"
        >
        {/* Dónde */}
        <div className={segment(panel === "city")}>
          <button
            type="button"
            className="w-full h-full text-left pr-6"
            aria-haspopup="dialog"
            aria-expanded={panel === "city"}
            onClick={() => setPanel(panel === "city" ? null : "city")}
          >
            <span className="block text-xs font-semibold text-gray-900">{t("search.where")}</span>
            <span className={`block truncate text-sm ${selectedCity ? "text-gray-900" : "text-gray-500"}`}>
              {selectedCity ? selectedCity.name : t("search.wherePlaceholder")}
            </span>
          </button>
          {selectedCity && <ClearButton label={t("search.clear")} onClear={() => onCityChange("")} />}
        </div>

        <Divider />

        {/* Especialidad */}
        <div className={segment(panel === "specialty")}>
          <button
            type="button"
            className="w-full h-full text-left pr-6"
            aria-haspopup="dialog"
            aria-expanded={panel === "specialty"}
            onClick={() => setPanel(panel === "specialty" ? null : "specialty")}
          >
            <span className="block text-xs font-semibold text-gray-900">{t("search.specialty")}</span>
            <span className={`block truncate text-sm ${selectedSpecialty ? "text-gray-900" : "text-gray-500"}`}>
              {selectedSpecialty ? selectedSpecialty.name : t("search.specialtyPlaceholder")}
            </span>
          </button>
          {selectedSpecialty && <ClearButton label={t("search.clear")} onClear={() => onSpecialtyChange("")} />}
        </div>

        <Divider />

        {/* Texto libre + botón */}
        <div className="flex items-center gap-2 flex-[1.4] min-w-0 pl-6 pr-2 py-2 md:py-0 md:h-full rounded-2xl md:rounded-full hover:bg-gray-100 focus-within:bg-white focus-within:shadow-lg">
          <label className="flex-1 min-w-0 cursor-text">
            <span className="block text-xs font-semibold text-gray-900">{t("search.query")}</span>
            <input
              ref={queryRef}
              type="text"
              value={q}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setPanel(null)}
              placeholder={t("search.queryPlaceholder")}
              className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-500 outline-none"
            />
          </label>
          <MagneticButton
            type="submit"
            disabled={disabled || loading}
            className="flex items-center justify-center gap-2 h-12 rounded-full bg-blue-600 px-4 md:px-5 text-white font-medium shadow-sm hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" strokeWidth={2.5} />}
            <span>{t("common.search")}</span>
          </MagneticButton>
        </div>
        </motion.div>
      </motion.form>
      )}

      {/* Panel de ciudades */}
      {panel === "city" && (
        <Popover className="md:w-[26rem]" label={t("search.where")}>
          <FilterInput value={cityFilter} onChange={setCityFilter} placeholder={t("search.searchCity")} />
          {cityFilter ? (
            <OptionList isEmpty={cityMatches.length === 0} empty={t("search.noMatches")}>
              {cityMatches.map((c) => (
                <Option
                  key={c.id}
                  visual={cityVisual(c.name) ?? { icon: MapPin, tile: "bg-gray-100 text-gray-500" }}
                  title={c.name}
                  subtitle={citySubtitle(c)}
                  selected={c.id === cityId}
                  onClick={() => pickCity(c.id)}
                />
              ))}
            </OptionList>
          ) : (
            <>
              <p className="px-6 pt-1 pb-2 text-xs font-medium text-gray-500">{t("search.featuredCities")}</p>
              <OptionList>
                <Option
                  visual={{ icon: Navigation, tile: "bg-blue-50 text-blue-600" }}
                  title={t("search.anyCity")}
                  subtitle={t("search.anyCityHint")}
                  selected={!cityId}
                  onClick={() => pickCity("")}
                />
                {featuredCities.map(({ city, visual }) => (
                  <Option
                    key={city.id}
                    visual={visual}
                    title={city.name}
                    subtitle={citySubtitle(city)}
                    selected={city.id === cityId}
                    onClick={() => pickCity(city.id)}
                  />
                ))}
              </OptionList>
            </>
          )}
        </Popover>
      )}

      {/* Panel de especialidades */}
      {panel === "specialty" && (
        <Popover className="md:left-1/4 md:w-[34rem]" label={t("search.specialty")}>
          <FilterInput value={specialtyFilter} onChange={setSpecialtyFilter} placeholder={t("search.searchSpecialty")} />
          {specialtyFilter ? (
            <OptionList isEmpty={specialtyMatches.length === 0} empty={t("search.noMatches")}>
              {specialtyMatches.map((s) => (
                <Option
                  key={s.id}
                  visual={specialtyVisual(s.name)}
                  title={s.name}
                  selected={s.id === specialtyId}
                  onClick={() => pickSpecialty(s.id)}
                />
              ))}
            </OptionList>
          ) : (
            <>
              <p className="px-6 pt-1 pb-2 text-xs font-medium text-gray-500">{t("search.featuredSpecialties")}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 px-3 pb-3">
                <Option
                  compact
                  visual={{ icon: Stethoscope, tile: "bg-blue-50 text-blue-600" }}
                  title={t("search.anySpecialty")}
                  selected={!specialtyId}
                  onClick={() => pickSpecialty("")}
                />
                {featuredSpecialties.map(({ specialty, visual }) => (
                  <Option
                    compact
                    key={specialty.id}
                    visual={visual}
                    title={specialty.name}
                    selected={specialty.id === specialtyId}
                    onClick={() => pickSpecialty(specialty.id)}
                  />
                ))}
              </div>
            </>
          )}
        </Popover>
      )}
    </div>
  );
}

function Divider() {
  return <span aria-hidden className="hidden md:block h-8 w-px bg-gray-200 shrink-0" />;
}

function ClearButton({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClear}
      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-gray-600 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-300"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  );
}

function Popover({ children, className = "", label }: { children: React.ReactNode; className?: string; label: string }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className={`absolute left-0 right-0 md:right-auto top-full mt-3 z-30 rounded-3xl border border-gray-100 bg-white py-4 shadow-2xl ${className}`}
    >
      <div className="max-h-[26rem] overflow-y-auto">{children}</div>
    </div>
  );
}

function FilterInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="px-6 pb-3">
      <div className="flex items-center gap-2 rounded-full border border-gray-200 px-4 h-11 focus-within:border-gray-400">
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        <input
          autoFocus
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}

function OptionList({ children, isEmpty = false, empty }: { children: React.ReactNode; isEmpty?: boolean; empty?: string }) {
  if (isEmpty && empty) return <p className="px-6 py-4 text-sm text-gray-500">{empty}</p>;
  return <ul className="px-3">{children}</ul>;
}

function Option({
  visual,
  title,
  subtitle,
  selected,
  onClick,
  compact = false,
}: {
  visual: CatalogVisual;
  title: string;
  subtitle?: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  const Icon = visual.icon;
  const Wrapper = compact ? "div" : "li";
  return (
    <Wrapper>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-4 rounded-2xl px-3 ${compact ? "py-2" : "py-2.5"} text-left transition-colors ${
          selected ? "bg-blue-50/60" : "hover:bg-gray-50"
        }`}
      >
        <span className={`flex shrink-0 items-center justify-center rounded-xl ${compact ? "h-10 w-10" : "h-12 w-12"} ${visual.tile}`}>
          <Icon className={compact ? "h-5 w-5" : "h-6 w-6"} strokeWidth={1.75} />
        </span>
        <span className="min-w-0">
          <span className={`block text-sm font-medium text-gray-900 ${compact ? "line-clamp-2" : "truncate"}`}>{title}</span>
          {subtitle && <span className="block truncate text-sm text-gray-500">{subtitle}</span>}
        </span>
      </button>
    </Wrapper>
  );
}
