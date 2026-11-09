"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type MutableRefObject } from "react";
import { MotionConfig, motionValue, useMotionValue, type MotionValue } from "framer-motion";

/**
 * Conecta la barra de búsqueda de una página con la navbar.
 *
 * Cuando el usuario baja y la barra grande quedaría debajo de la navbar, la
 * página la "acopla": deja de pintarla y la navbar muestra una versión compacta
 * en su lugar. El elemento que desaparece deja su rectángulo en `lastRect` y
 * el que aparece arranca desde ahí (ver `morphFrom`), así se ve una sola
 * píldora que se encoge y sube, y vuelve a crecer al subir.
 */
export interface SearchDockSummary {
  where: string;
  specialty: string;
  query: string;
}

interface DockState {
  /** Hay una barra acoplable en la página actual. */
  available: boolean;
  docked: boolean;
  summary: SearchDockSummary;
}

interface SearchDockApi extends DockState {
  /** Lo que hace la píldora compacta al pulsarla. */
  expand: () => void;
  setDockState: (state: DockState) => void;
  setExpandHandler: (fn: (() => void) | null) => void;
  /** Rectángulo del último elemento que desapareció, para el cambio de forma. */
  lastRect: MutableRefObject<DOMRect | null>;
  /** La píldora de la navbar, para medirla antes de desacoplar. */
  pillEl: MutableRefObject<HTMLElement | null>;
  /**
   * Cuánto ha recorrido la barra hacia la navbar: 0 arriba del todo, 1 al
   * acoplarse. Es un MotionValue para que la navbar anime con el scroll sin
   * volver a renderizarse en cada cuadro.
   */
  dockProgress: MotionValue<number>;
}

const EMPTY: SearchDockSummary = { where: "", specialty: "", query: "" };

const SearchDockContext = createContext<SearchDockApi | null>(null);

export function SearchDockProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DockState>({ available: false, docked: false, summary: EMPTY });
  const expandRef = useRef<(() => void) | null>(null);
  const lastRect = useRef<DOMRect | null>(null);
  const pillEl = useRef<HTMLElement | null>(null);
  const dockProgress = useMotionValue(0);

  const setDockState = useCallback(
    (next: DockState) =>
      setState((prev) =>
        prev.available === next.available &&
        prev.docked === next.docked &&
        prev.summary.where === next.summary.where &&
        prev.summary.specialty === next.summary.specialty &&
        prev.summary.query === next.summary.query
          ? prev
          : next,
      ),
    [],
  );
  const setExpandHandler = useCallback((fn: (() => void) | null) => {
    expandRef.current = fn;
  }, []);
  const expand = useCallback(() => expandRef.current?.(), []);

  const value = useMemo(
    () => ({ ...state, expand, setDockState, setExpandHandler, lastRect, pillEl, dockProgress }),
    [state, expand, setDockState, setExpandHandler, dockProgress],
  );
  return (
    <SearchDockContext.Provider value={value}>
      {/* reducedMotion="user": si el sistema pide reducir movimiento, framer
          omite las animaciones de transformación. */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </SearchDockContext.Provider>
  );
}

const noopRef = { current: null };
const noopProgress = motionValue(0);

export function useSearchDock(): SearchDockApi {
  const ctx = useContext(SearchDockContext);
  if (!ctx) {
    // Sin proveedor (por ejemplo en una prueba aislada) no hay acople.
    return {
      available: false,
      docked: false,
      summary: EMPTY,
      expand: () => {},
      setDockState: () => {},
      setExpandHandler: () => {},
      lastRect: noopRef,
      pillEl: noopRef,
      dockProgress: noopProgress,
    };
  }
  return ctx;
}
