"use client";

import { useEffect, useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import type { SessionSummary } from "@/types/board";
import { fetchSessionList } from "@/lib/api/sessions";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionErrorBanner } from "@/components/dashboard/session-error-banner";
import { SessionListItem } from "@/components/history/session-list-item";

export function SessionHistory() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSessionList()
      .then((data) => {
        if (!cancelled) setSessions(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load session history.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <SessionErrorBanner message={error} />;

  if (sessions === null) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={HistoryIcon}
        title="No sessions yet"
        description="Completed board sessions will appear here."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {sessions.map((session) => (
        <SessionListItem key={session.id} session={session} />
      ))}
    </ul>
  );
}