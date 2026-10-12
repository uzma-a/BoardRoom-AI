import { FileCheck, BarChart3, Vote, ListChecks, FileSearch } from "lucide-react";
import type { BoardResolution } from "@/types/board";
import { WorkspaceSection } from "@/components/dashboard/workspace-section";
import { VerdictBanner } from "@/components/report/verdict-banner";
import { BoardScorecard } from "@/components/report/board-scorecard";
import { BoardVotesPanel } from "@/components/report/board-votes-panel";
import { AnalysisAccordion } from "@/components/report/analysis-accordion";
import { NextStepsList } from "@/components/report/next-steps-list";
import { ExportReportButton } from "@/components/report/export-report-button";

interface ExecutiveReportProps {
  resolution: BoardResolution;
  ideaSummary: string;
}

export function ExecutiveReport({ resolution, ideaSummary }: ExecutiveReportProps) {
  return (
    <div className="flex flex-col gap-6">
      <WorkspaceSection
        title="Board Resolution"
        icon={FileCheck}
        description="The board's final, synthesized decision"
        action={<ExportReportButton resolution={resolution} ideaSummary={ideaSummary} />}
      >
        <VerdictBanner resolution={resolution} />
      </WorkspaceSection>

      <WorkspaceSection title="Board Scorecard" icon={BarChart3}>
        <BoardScorecard resolution={resolution} />
      </WorkspaceSection>

      <WorkspaceSection title="Board Votes" icon={Vote}>
        <BoardVotesPanel resolution={resolution} />
      </WorkspaceSection>

      <WorkspaceSection title="Detailed Analysis" icon={FileSearch} description="Expand any section for the full finding">
        <AnalysisAccordion resolution={resolution} />
      </WorkspaceSection>

      <WorkspaceSection title="Recommended Next Steps" icon={ListChecks}>
        <NextStepsList steps={resolution.recommended_next_steps} />
      </WorkspaceSection>
    </div>
  );
}
