import type { Metadata } from "next";
import { BoardSessionProvider } from "@/context/board-session-context";
import { IdeaInputPanel } from "@/components/dashboard/idea-input-panel";
import { BoardWorkspace } from "@/components/dashboard/board-workspace";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Submit a business idea and watch the AI board analyze, debate, and vote in real time.",
};

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <IdeaInputPanel />
      <BoardWorkspace />
    </div>
  );
}
