import type { AgentKey, VoteChoice } from "@/types/board";
import { AGENT_META } from "@/lib/constants/agents";
import { VoteBadge } from "@/components/board/vote-badge";

const VOTE_LONG_LABEL: Record<VoteChoice, string> = {
  approve: "Approve",
  conditional: "Approve with Conditions",
  reject: "Reject",
};

interface VoteCardProps {
  agent: AgentKey;
  vote: VoteChoice;
}

export function VoteCard({ agent, vote }: VoteCardProps) {
  const meta = AGENT_META[agent];
  const Icon = meta.icon;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-white/[0.02] px-4 py-3.5 transition-colors duration-150 hover:border-muted/50 hover:bg-white/[0.04]">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{meta.label}</p>
        <p className="truncate text-xs text-muted">{VOTE_LONG_LABEL[vote]}</p>
      </div>
      <VoteBadge vote={vote} />
    </div>
  );
}
