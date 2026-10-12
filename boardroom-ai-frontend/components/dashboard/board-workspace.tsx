"use client";

import dynamic from "next/dynamic";
import { Users, Landmark, GitCompareArrows } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkspaceSection } from "@/components/dashboard/workspace-section";
import { SessionErrorBanner } from "@/components/dashboard/session-error-banner";
import { AgentCardGrid } from "@/components/board/agent-card-grid";
import { DebateTimeline } from "@/components/board/debate-timeline";
import { useBoardSession } from "@/hooks/use-board-session";
import { AGENT_ORDER } from "@/lib/constants/agents";
import { FollowupChat } from "@/components/history/followup-chat";

// The report (and everything it pulls in — accordions, scorecard, the
// PDF export path) is only ever needed once a resolution actually
// exists, which is the last thing to arrive in a session. Loading it on
// demand instead of in the initial dashboard bundle means every visitor
// who never gets that far never pays for its code.
const ExecutiveReport = dynamic(
  () => import("@/components/report/executive-report").then((mod) => mod.ExecutiveReport),
  {
    loading: () => (
      <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-surface/40 p-6">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-20 w-full" />
      </div>
    ),
  }
);

export function BoardWorkspace() {
  const { state } = useBoardSession();

  if (state.status === "idle") {
    return (
      <EmptyState
        icon={Landmark}
        title="The board hasn't convened yet"
        description="Submit a business idea above to see CTO, CFO, Marketing, Legal, Risk, and CEO analyze it live."
      />
    );
  }

  const completedCount = AGENT_ORDER.filter((key) => state.agents[key].status === "done").length;

  return (
    <div className="flex flex-col gap-6">
      {state.status === "error" && state.error && <SessionErrorBanner message={state.error} />}

      <WorkspaceSection
        title="Live Board Meeting"
        icon={Users}
        description={`${completedCount} of ${AGENT_ORDER.length} executives reporting`}
      >
        <AgentCardGrid agents={state.agents} />
      </WorkspaceSection>

      <WorkspaceSection
        title="Debate Timeline"
        icon={GitCompareArrows}
        description="Chronological record of the session"
      >
        <DebateTimeline events={state.timeline} />
      </WorkspaceSection>

      {state.resolution && <ExecutiveReport resolution={state.resolution} ideaSummary={state.idea} />}
      {state.resolution && state.sessionId && <FollowupChat key={state.sessionId} sessionId={state.sessionId} />}
    </div>
  );
}

