import { memo } from "react";
import { GitCompareArrows, CheckCircle2, AlertTriangle, Gavel } from "lucide-react";
import type { TimelineEvent, TimelineTone } from "@/types/board";
import { AGENT_META } from "@/lib/constants/agents";
import { formatClockTime } from "@/lib/format/time";
import { cn } from "@/lib/utils";

interface DebateTimelineItemProps {
  event: TimelineEvent;
  isLast: boolean;
}

const TONE_STYLES: Record<TimelineTone, { ring: string; iconBg: string; iconColor: string; labelColor: string }> = {
  neutral: {
    ring: "ring-border/60",
    iconBg: "bg-white/[0.04]",
    iconColor: "text-muted",
    labelColor: "text-foreground",
  },
  agree: {
    ring: "ring-success/40",
    iconBg: "bg-success/10",
    iconColor: "text-success",
    labelColor: "text-foreground",
  },
  disagree: {
    ring: "ring-warning/40",
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    labelColor: "text-foreground",
  },
  conclusion: {
    ring: "ring-primary/50",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    labelColor: "text-foreground",
  },
};

/** Picks an icon for the event: the agent's own icon for agent-authored events, a tone icon for Debate Engine findings. */
function getTimelineIcon(event: TimelineEvent) {
  if (event.tone === "conclusion") return Gavel;
  if (event.tone === "agree") return CheckCircle2;
  if (event.tone === "disagree") return AlertTriangle;
  if (event.agent === "debate_engine") return GitCompareArrows;
  return AGENT_META[event.agent].icon;
}

export const DebateTimelineItem = memo(function DebateTimelineItem({ event, isLast }: DebateTimelineItemProps) {
  const tone = TONE_STYLES[event.tone];
  const Icon = getTimelineIcon(event);

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1", tone.iconBg, tone.ring)}>
          <Icon className={cn("h-4 w-4", tone.iconColor)} aria-hidden="true" />
        </span>
        {!isLast && <span className="mt-2 w-px flex-1 bg-border/60" aria-hidden="true" />}
      </div>
      <div className="pb-6">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className={cn("text-sm font-medium", tone.labelColor)}>{event.label}</p>
          <time className="font-mono text-[11px] text-muted/70" dateTime={new Date(event.timestamp).toISOString()}>
            {formatClockTime(event.timestamp)}
          </time>
        </div>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">{event.detail}</p>
      </div>
    </div>
  );
});
