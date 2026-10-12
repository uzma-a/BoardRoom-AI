import type { BoardResolution } from "@/types/board";
import { ScorecardMetric } from "@/components/report/scorecard-metric";

interface BoardScorecardProps {
  resolution: BoardResolution;
}

/**
 * Every metric here is a real specialist's own reported confidence in
 * their analysis — nothing is a separately invented "risk score." Legal
 * Risk and Execution Risk specifically show how confident Legal/Risk are
 * in *their own* assessment, not an inverse risk-severity score, which
 * is why the methodology note below is shown rather than left implicit.
 */
export function BoardScorecard({ resolution }: BoardScorecardProps) {
  return (
    <div>
      <p className="mb-4 text-xs text-muted">
        Each score reflects that specialist&rsquo;s own confidence in their analysis.
      </p>
      <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
        <ScorecardMetric label="Technical Feasibility" value={resolution.technical_analysis.confidence} />
        <ScorecardMetric label="Financial Viability" value={resolution.financial_analysis.confidence} />
        <ScorecardMetric label="Market Opportunity" value={resolution.marketing_analysis.confidence} />
        <ScorecardMetric label="Legal Risk Assessment" value={resolution.legal_analysis.confidence} />
        <ScorecardMetric label="Execution Risk Assessment" value={resolution.risk_analysis.confidence} />
        <ScorecardMetric label="Overall Confidence" value={resolution.overall_confidence} />
      </div>
    </div>
  );
}
