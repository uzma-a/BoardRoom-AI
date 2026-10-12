import type { Variants } from "framer-motion";

/**
 * Centralized motion variants. Components import these instead of
 * hand-rolling one-off transition objects — this is what keeps every
 * fade/slide/stagger in the product feeling like the same considered
 * system rather than a pile of unrelated effects (a big part of what
 * separates "premium SaaS" motion from "AI demo" motion).
 *
 * This file grows further in the dedicated Animations step; what's here
 * now covers exactly what the Landing page needs.
 */

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const staggerContainer = (staggerChildren = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren, delayChildren },
  },
});

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};
