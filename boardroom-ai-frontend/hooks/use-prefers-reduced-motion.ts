"use client";

import { useEffect, useState } from "react";

/**
 * Tracks `prefers-reduced-motion`. Components pass this to Framer Motion
 * (e.g. skip `initial`/`animate` props, or use instant transitions) so
 * motion is an enhancement, never a requirement, for anyone who has
 * asked their OS to minimize it. CSS-level animations are already
 * hard-disabled in globals.css as a backstop; this hook is for the
 * component-level decisions CSS can't make (e.g. "should this stagger at all").
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(query.matches);

    const handleChange = (event: MediaQueryListEvent) => setPrefersReduced(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return prefersReduced;
}
