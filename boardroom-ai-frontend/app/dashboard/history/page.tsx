import type { Metadata } from "next";
import { SessionHistory } from "@/components/history/session-history";

export const metadata: Metadata = {
  title: "History",
  description: "Review past board sessions.",
};

export default function HistoryPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Session History</h2>
        <p className="mt-1 text-sm text-muted">Every completed board session, newest first.</p>
      </div>
      <SessionHistory />
    </div>
  );
}