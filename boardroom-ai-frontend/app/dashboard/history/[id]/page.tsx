import type { Metadata } from "next";
import { SessionDetail } from "@/components/history/session-detail";

export const metadata: Metadata = {
  title: "Session Details",
};

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="mx-auto max-w-4xl">
      <SessionDetail id={id} />
    </div>
  );
}