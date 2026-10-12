"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TimelineEvent } from "@/types/board";
import { DebateTimelineItem } from "@/components/board/debate-timeline-item";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

interface DebateTimelineProps {
  events: TimelineEvent[];
}

/**
 * Renders the board's chronological event log. Each entry is real: agent
 * start/finish events, and the Debate Engine's actual agreement/conflict
 * strings (see lib/board/reducer.ts's toTimelineEvents) -- nothing here
 * is a scripted conversation. New entries animate in individually as
 * they're dispatched, which is what makes the "live" feel work once
 * Step 9 wires this up to real streamed events.
 */
export function DebateTimeline({ events }: DebateTimelineProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  if (events.length === 0) {
    return <p className="text-sm text-muted">No board activity yet.</p>;
  }

  return (
    <ol
      className="scrollbar-thin max-h-[480px] overflow-y-auto pr-1"
      tabIndex={0}
      aria-label="Board session activity log"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {events.map((event, index) => (
          <motion.li
            key={event.id}
            layout={!prefersReducedMotion}
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <DebateTimelineItem event={event} isLast={index === events.length - 1} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ol>
  );
}
