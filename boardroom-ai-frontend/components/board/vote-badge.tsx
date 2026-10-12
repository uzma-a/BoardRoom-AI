import { Check, AlertTriangle, X } from "lucide-react";
import type { VoteChoice } from "@/types/board";
import { Badge, type BadgeVariant } from "@/components/ui/badge";

const VOTE_CONFIG: Record<VoteChoice, { label: string; variant: BadgeVariant; icon: typeof Check }> = {
  approve: { label: "Approve", variant: "success", icon: Check },
  conditional: { label: "Conditional", variant: "warning", icon: AlertTriangle },
  reject: { label: "Reject", variant: "danger", icon: X },
};

interface VoteBadgeProps {
  vote: VoteChoice;
}

export function VoteBadge({ vote }: VoteBadgeProps) {
  const config = VOTE_CONFIG[vote];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant}>
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}
