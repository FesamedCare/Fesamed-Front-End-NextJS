"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export default function PageTransitionWrapper({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{y:0, opacity: 0 }}
        animate={{y:0, opacity: 1 }}
        transition={{ duration: 0.75, ease: "easeInOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
