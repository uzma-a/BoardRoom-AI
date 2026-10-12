import type { LucideIcon } from "lucide-react";
import type { AgentStatus } from "@/types/board";
import { cn } from "@/lib/utils";

interface AgentAvatarProps {
  icon: LucideIcon;
  status: AgentStatus;
}

const RING_CLASSES: Record<AgentStatus, string> = {
  waiting: "ring-1 ring-border/60 text-muted bg-white/[0.03]",
  thinking: "ring-2 ring-primary/50 text-primary bg-primary/10 animate-pulse",
  done: "ring-1 ring-success/40 text-success bg-success/10",
  error: "ring-1 ring-danger/40 text-danger bg-danger/10",
};

export function AgentAvatar({ icon: Icon, status }: AgentAvatarProps) {
  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300",
        RING_CLASSES[status]
      )}
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
    </span>
  );
}
