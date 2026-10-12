"use client";

import { motion } from "framer-motion";
import { Gavel } from "lucide-react";
import type { BoardResolution } from "@/types/board";
import { toneForValue } from "@/components/ui/progress-bar";
import { scaleIn } from "@/lib/motion/variants";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface VerdictBannerProps {
  resolution: BoardResolution;
}

const TONE_CLASSES = {
  success: "border-success/40 bg-success/[0.06]",
  warning: "border-warning/40 bg-warning/[0.06]",
  danger: "border-danger/40 bg-danger/[0.06]",
} as const;

const ICON_TONE_CLASSES = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  danger: "bg-danger/10 text-danger",
} as const;

/**
 * Colored by overall_confidence (via the same toneForValue thresholds
 * used everywhere else in the app) rather than by keyword-matching the
 * final_decision text -- a numeric threshold is reliable, sentiment
 * parsing free text is not. Scales in on mount since this is the single
 * highest-stakes moment in the whole product: the board's verdict.
 */
export function VerdictBanner({ resolution }: VerdictBannerProps) {
  const tone = toneForValue(resolution.overall_confidence);
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={prefersReducedMotion ? undefined : "hidden"}
      animate={prefersReducedMotion ? undefined : "visible"}
      variants={prefersReducedMotion ? undefined : scaleIn}
      className={cn("rounded-2xl border p-5 sm:p-6", TONE_CLASSES[tone])}
    >
      <div className="flex items-start gap-4">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", ICON_TONE_CLASSES[tone])}>
          <Gavel className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Board Resolution</p>
          <p className="mt-1.5 text-base font-semibold leading-relaxed text-foreground">
            {resolution.final_decision}
          </p>
        </div>
      </div>

      <div className="mt-5 border-t border-border/40 pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Executive Summary</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{resolution.executive_summary}</p>
      </div>
    </motion.div>
  );
}
