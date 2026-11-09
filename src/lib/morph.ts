import { animate } from "framer-motion";

/**
 * Resorte del cambio de forma entre la barra de búsqueda y la píldora de la
 * navbar. Con este amortiguamiento el progreso pasa un poco de 1 y vuelve: el
 * elemento se estira de más y se asienta, el "squish" del video de referencia
 * (~300 ms).
 */
export const MORPH_SPRING = { type: "spring", stiffness: 380, damping: 26, mass: 0.9 } as const;

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/**
 * Hace que `el`, recién montado, parezca salir de `from` (el rectángulo del
 * elemento que acaba de desaparecer) y crezca o se encoja hasta su tamaño real.
 *
 * Se anima un único progreso de 0 a 1 y en cada cuadro se escriben ancho, alto
 * y desplazamiento. No se usa `animate(el, {...})` sobre el elemento: los
 * componentes `motion.*` reescriben su propio `transform` al renderizar y
 * cancelaban la animación a medias (el ancho quedaba congelado). Por lo mismo
 * el desplazamiento va en la propiedad CSS `translate`, que framer no toca.
 *
 * Ancho y alto son reales, no escala: el texto y las esquinas no se deforman.
 */
export function morphFrom(el: HTMLElement, from: DOMRect): void {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const to = el.getBoundingClientRect();
  if (!to.width || !to.height || !from.width || !from.height) return;

  // Con el tamaño de partida puesto, se mide dónde queda el centro; el
  // desplazamiento lleva ese centro al del elemento anterior.
  // Sin tope de ancho mientras dura el cambio: la píldora tiene max-width y
  // recortaría el tamaño de partida, perdiendo el primer tramo del encogimiento.
  el.style.overflow = "hidden";
  el.style.maxWidth = "none";
  el.style.width = `${from.width}px`;
  el.style.height = `${from.height}px`;
  const start = el.getBoundingClientRect();
  const dx = from.left + from.width / 2 - (start.left + start.width / 2);
  const dy = from.top + from.height / 2 - (start.top + start.height / 2);
  el.style.translate = `${dx}px ${dy}px`;

  const clear = () => {
    el.style.width = "";
    el.style.height = "";
    el.style.translate = "";
    el.style.overflow = "";
    el.style.maxWidth = "";
  };

  animate(0, 1, {
    ...MORPH_SPRING,
    onUpdate: (p) => {
      el.style.width = `${lerp(from.width, to.width, p)}px`;
      el.style.height = `${lerp(from.height, to.height, p)}px`;
      el.style.translate = `${lerp(dx, 0, p)}px ${lerp(dy, 0, p)}px`;
    },
    onComplete: clear,
  });
}
