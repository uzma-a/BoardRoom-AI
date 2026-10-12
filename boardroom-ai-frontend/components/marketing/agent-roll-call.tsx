"use client";

import { motion } from "framer-motion";
import { AGENT_META, AGENT_ORDER } from "@/lib/constants/agents";
import { fadeInUp, staggerContainer } from "@/lib/motion/variants";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

/**
 * The hero's signature element: the six executives, named and ready,
 * rendered as a single row before any analysis has started. This is
 * deliberately not an abstract graphic — it's the literal roster of who
 * shows up when you submit an idea, which is the actual product.
 */
export function AgentRollCall() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.ul
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6"
      variants={prefersReducedMotion ? undefined : staggerContainer(0.06, 0.3)}
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
      aria-label="The six AI executives on the board"
    >
      {AGENT_ORDER.map((key) => {
        const agent = AGENT_META[key];
        const Icon = agent.icon;
        return (
          <motion.li
            key={key}
            variants={prefersReducedMotion ? undefined : fadeInUp}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-surface/40 px-3 py-4 text-center"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            </span>
            <span className="text-xs font-semibold text-foreground">{agent.label}</span>
            <span className="flex items-center gap-1 text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
              Ready
            </span>
          </motion.li>
        );
      })}
    </motion.ul>
  );
}
