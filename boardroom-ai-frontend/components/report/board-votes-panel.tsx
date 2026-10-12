import type { BoardResolution } from "@/types/board";
import { VoteCard } from "@/components/report/vote-card";
import { SPECIALIST_AGENTS } from "@/types/board";

interface BoardVotesPanelProps {
  resolution: BoardResolution;
}

export function BoardVotesPanel({ resolution }: BoardVotesPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {SPECIALIST_AGENTS.map((agent) => {
        const vote = resolution.board_votes[agent];
        if (!vote) return null;
        return <VoteCard key={agent} agent={agent} vote={vote} />;
      })}
    </div>
  );
}
