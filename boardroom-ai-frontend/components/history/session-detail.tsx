"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { BoardResolution, SessionSummary } from "@/types/board";
import { fetchSessionDetail, fetchSessionList } from "@/lib/api/sessions";
import { ExecutiveReport } from "@/components/report/executive-report";
import { SessionErrorBanner } from "@/components/dashboard/session-error-banner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatSessionDate } from "@/lib/format/time";
import { ROUTES } from "@/lib/constants/site";
import { FollowupChat } from "@/components/history/followup-chat";

interface LoadedSession {
  resolution: BoardResolution;
  summary: SessionSummary | undefined;
}

export function SessionDetail({ id }: { id: string }) {
  const [data, setData] = useState<LoadedSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchSessionDetail(id), fetchSessionList()])
      .then(([resolution, list]) => {
        if (!cancelled) setData({ resolution, summary: list.find((s) => s.id === id) });
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load this session.");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={ROUTES.history}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to history
      </Link>

      {error && <SessionErrorBanner message={error} />}

      {!error && data === null && (
        <div className="flex flex-col gap-3" aria-busy="true">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      )}

      {data && (
        <>
          {data.summary && (
            <div>
              <p className="text-sm font-medium text-foreground">{data.summary.idea}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                <span>{formatSessionDate(data.summary.created_at)}</span>
                {data.summary.target_market && <Badge variant="neutral">{data.summary.target_market}</Badge>}
                {data.summary.id.startsWith("example-") && <Badge variant="primary">Example</Badge>}
              </div>
            </div>
          )}
          <ExecutiveReport resolution={data.resolution} ideaSummary={data.summary?.idea ?? ""} />
          <FollowupChat sessionId={id} />
        </>
      )}
    </div>
  );
}