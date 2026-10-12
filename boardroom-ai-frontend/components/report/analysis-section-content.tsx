import { ExternalLink } from "lucide-react";
import type { AgentFinding } from "@/types/board";
import { ConfidenceMeter } from "@/components/board/confidence-meter";

interface AnalysisSectionContentProps {
  finding: AgentFinding;
}

function isUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/** Reference strings are either real URLs (Gemini search grounding) or plain citation text — render each appropriately. */
function ReferenceItem({ reference }: { reference: string }) {
  if (isUrl(reference)) {
    let hostname = reference;
    try {
      hostname = new URL(reference).hostname.replace(/^www\./, "");
    } catch {
      // fall back to the raw string
    }
    return (
      <a
        href={reference}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-1.5 text-primary-text hover:underline"
      >
        <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
        <span className="truncate">{hostname}</span>
      </a>
    );
  }
  return <span className="text-muted">{reference}</span>;
}

export function AnalysisSectionContent({ finding }: AnalysisSectionContentProps) {
  return (
    <div className="flex flex-col gap-5">
      <ConfidenceMeter confidence={finding.confidence} />

      <p className="text-sm leading-relaxed text-foreground">{finding.summary}</p>

      {finding.key_points.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Key Points</h4>
          <ul className="mt-2 space-y-1.5">
            {finding.key_points.map((point, index) => (
              <li key={index} className="flex gap-2 text-sm leading-relaxed text-muted">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-muted/60" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}

      {finding.risks_identified.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Risks Identified</h4>
          <ul className="mt-2 space-y-1.5">
            {finding.risks_identified.map((risk, index) => (
              <li key={index} className="flex gap-2 text-sm leading-relaxed text-muted">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-warning/60" aria-hidden="true" />
                {risk}
              </li>
            ))}
          </ul>
        </div>
      )}

      {finding.references.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Sources ({finding.references.length})
          </h4>
          <ul className="mt-2 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
            {finding.references.slice(0, 8).map((reference, index) => (
              <li key={index} className="truncate">
                <ReferenceItem reference={reference} />
              </li>
            ))}
          </ul>
          {finding.references.length > 8 && (
            <p className="mt-2 text-xs text-muted/70">+{finding.references.length - 8} more sources</p>
          )}
        </div>
      )}
    </div>
  );
}
