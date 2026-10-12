import type { BoardResolution } from "@/types/board";
import { AGENT_META } from "@/lib/constants/agents";
import { AccordionItem } from "@/components/ui/accordion";
import { AnalysisSectionContent } from "@/components/report/analysis-section-content";
import { VoteBadge } from "@/components/board/vote-badge";

interface AnalysisAccordionProps {
  resolution: BoardResolution;
}

export function AnalysisAccordion({ resolution }: AnalysisAccordionProps) {
  const sections = [
    { agent: "cto" as const, finding: resolution.technical_analysis, label: "Technical Analysis" },
    { agent: "cfo" as const, finding: resolution.financial_analysis, label: "Financial Analysis" },
    { agent: "marketing" as const, finding: resolution.marketing_analysis, label: "Marketing Analysis" },
    { agent: "legal" as const, finding: resolution.legal_analysis, label: "Legal Analysis" },
    { agent: "risk" as const, finding: resolution.risk_analysis, label: "Risk Analysis" },
  ];

  return (
    <div>
      {sections.map(({ agent, finding, label }, index) => {
        const meta = AGENT_META[agent];
        const Icon = meta.icon;
        return (
          <AccordionItem
            key={agent}
            defaultOpen={index === 0}
            title={
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-xs text-muted">{meta.role}</p>
                </div>
              </div>
            }
            subtitle={finding.vote && <VoteBadge vote={finding.vote} />}
          >
            <div className="pl-11">
              <AnalysisSectionContent finding={finding} />
            </div>
          </AccordionItem>
        );
      })}
    </div>
  );
}
