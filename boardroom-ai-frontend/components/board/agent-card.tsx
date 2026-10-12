"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Circle, Clock } from "lucide-react";
import type { AgentCardState } from "@/types/board";
import { AGENT_META } from "@/lib/constants/agents";
import { AgentAvatar } from "@/components/board/agent-avatar";
import { ThinkingIndicator } from "@/components/board/thinking-indicator";
import { ConfidenceMeter } from "@/components/board/confidence-meter";
import { VoteBadge } from "@/components/board/vote-badge";
import { Spinner } from "@/components/ui/spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration } from "@/lib/format/time";
import { fadeInUp } from "@/lib/motion/variants";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/utils";

interface AgentCardProps {
  agentState: AgentCardState;
}

const CARD_BORDER_CLASSES = {
  waiting: "border-border/60",
  thinking: "border-primary/40 shadow-glow-primary",
  done: "border-border/60",
  error: "border-danger/40",
} as const;

const STATUS_TEXT = {
  waiting: "Waiting",
  thinking: "Thinking",
  done: "Analysis complete",
  error: "Unavailable",
} as const;

function CompletionIndicator({ status }: { status: AgentCardState["status"] }) {
  switch (status) {
    case "done":
      return <CheckCircle2 className="h-4 w-4 text-success" aria-label="Complete" />;
    case "thinking":
      return <Spinner className="h-4 w-4 text-primary" />;
    case "error":
      return <AlertCircle className="h-4 w-4 text-danger" aria-label="Unavailable" />;
    case "waiting":
    default:
      return <Circle className="h-3 w-3 text-muted/50" aria-label="Waiting" />;
  }
}

/** Previews the shape of the content about to arrive — the confidence bar, vote badge, and summary lines. */
function ThinkingSkeleton() {
  return (
    <div className="mt-4 flex flex-col gap-3" aria-hidden="true">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-8" />
        </div>
        <Skeleton className="h-1.5 w-full" />
      </div>
      <Skeleton className="h-5 w-24 rounded-full" />
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export const AgentCard = memo(function AgentCard({ agentState }: AgentCardProps) {
  const meta = AGENT_META[agentState.key];
  const { status, finding, startedAt, finishedAt, errorMessage } = agentState;
  const prefersReducedMotion = usePrefersReducedMotion();

  const duration = startedAt && finishedAt ? finishedAt - startedAt : null;

  return (
    <motion.article
      layout={!prefersReducedMotion}
      variants={fadeInUp}
      transition={{ layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
      className={cn(
        "flex flex-col rounded-2xl border bg-surface/40 p-5 transition-colors duration-300",
        CARD_BORDER_CLASSES[status],
        status === "waiting" && "opacity-60"
      )}
      aria-label={`${meta.role} — ${STATUS_TEXT[status]}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AgentAvatar icon={meta.icon} status={status} />
          <div>
            <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
            <p className="text-xs text-muted">{meta.role}</p>
          </div>
        </div>
        <CompletionIndicator status={status} />
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <span>{STATUS_TEXT[status]}</span>
        {status === "thinking" && <ThinkingIndicator />}
      </div>

      {status === "thinking" && <ThinkingSkeleton />}

      {status === "done" && finding && (
        <div className="mt-4 flex flex-1 flex-col gap-3">
          <ConfidenceMeter confidence={finding.confidence} />
          {finding.vote && <VoteBadge vote={finding.vote} />}
          <p className="text-xs leading-relaxed text-muted">{finding.summary}</p>
          {duration !== null && (
            <div className="mt-auto flex items-center gap-1.5 pt-1 text-[11px] text-muted/70">
              <Clock className="h-3 w-3" aria-hidden="true" />
              Completed in {formatDuration(duration)}
            </div>
          )}
        </div>
      )}

      {status === "error" && errorMessage && (
        <p className="mt-4 text-xs leading-relaxed text-danger/90">{errorMessage}</p>
      )}

      {status === "waiting" && (
        <p className="mt-4 text-xs leading-relaxed text-muted/70">{meta.description}</p>
      )}
    </motion.article>
  );
});
