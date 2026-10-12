"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface HoverLiftProps {
  children: ReactNode;
  className?: string;
}

/**
 * A thin client-only wrapper for the "lift on hover" micro-interaction.
 * Deliberately takes only `children` (already-rendered JSX) rather than
 * data props like icons or callbacks -- Server Components can pass
 * rendered elements across the server/client boundary freely, but not
 * raw component references or functions, which is what broke the first
 * version of this (FeatureCard itself was marked "use client" and
 * received a LucideIcon *reference* as a prop from its server-rendered
 * parent, which Next.js can't serialize). Keeping the interactive part
 * this thin avoids that whole class of bug.
 */
export function HoverLift({ children, className }: HoverLiftProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { y: -4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}
