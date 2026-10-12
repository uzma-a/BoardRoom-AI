import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SessionSummary } from "@/types/board";
import { Badge } from "@/components/ui/badge";
import { toneForValue } from "@/components/ui/progress-bar";
import { formatSessionDate } from "@/lib/format/time";
import { ROUTES } from "@/lib/constants/site";

export function SessionListItem({ session }: { session: SessionSummary }) {
  return (
    <li>
      <Link
        href={`${ROUTES.history}/${session.id}`}
        className="flex items-start justify-between gap-4 rounded-2xl border border-border/60 bg-surface/40 p-5 transition-colors duration-150 hover:border-muted/50 hover:bg-surface/70"
      >
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium text-foreground">{session.idea}</p>
          {session.final_decision && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{session.final_decision}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{formatSessionDate(session.created_at)}</span>
            {session.target_market && <Badge variant="neutral">{session.target_market}</Badge>}
            {session.id.startsWith("example-") && <Badge variant="primary">Example</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {session.overall_confidence !== null && (
            <Badge variant={toneForValue(session.overall_confidence)}>
              {Math.round(session.overall_confidence * 100)}%
            </Badge>
          )}
          <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />
        </div>
      </Link>
    </li>
  );
}