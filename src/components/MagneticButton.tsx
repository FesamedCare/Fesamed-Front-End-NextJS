"use client";

import { forwardRef, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, type HTMLMotionProps } from "framer-motion";

/**
 * Botón con efecto magnético: se desplaza unos píxeles hacia el cursor y vuelve
 * con un resorte al salir. Al presionarlo se comprime un poco.
 *
 * El desplazamiento es pequeño (`strength` px como máximo) para que se sienta
 * vivo sin que el botón "huya" del clic.
 */
type Props = HTMLMotionProps<"button"> & { strength?: number };

export const MagneticButton = forwardRef<HTMLButtonElement, Props>(function MagneticButton(
  { strength = 6, style, onMouseMove, onMouseLeave, ...props },
  forwardedRef,
) {
  const localRef = useRef<HTMLButtonElement | null>(null);
  const reduce = useReducedMotion();
  const x = useSpring(useMotionValue(0), { stiffness: 300, damping: 18, mass: 0.4 });
  const y = useSpring(useMotionValue(0), { stiffness: 300, damping: 18, mass: 0.4 });

  return (
    <motion.button
      ref={(node) => {
        localRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) forwardedRef.current = node;
      }}
      style={{ ...style, x, y }}
      whileTap={reduce ? undefined : { scale: 0.92 }}
      onMouseMove={(e) => {
        onMouseMove?.(e);
        if (reduce || !localRef.current) return;
        const r = localRef.current.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        x.set(Math.max(-1, Math.min(1, dx)) * strength);
        y.set(Math.max(-1, Math.min(1, dy)) * strength);
      }}
      onMouseLeave={(e) => {
        onMouseLeave?.(e);
        x.set(0);
        y.set(0);
      }}
      {...props}
    />
  );
});
