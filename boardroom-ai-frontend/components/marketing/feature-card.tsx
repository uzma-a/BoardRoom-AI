import type { LucideIcon } from "lucide-react";
import { HoverLift } from "@/components/ui/hover-lift";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <HoverLift className="group rounded-2xl border border-border/60 bg-surface/40 p-6 transition-colors duration-150 hover:border-muted/50 hover:bg-surface/70">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
    </HoverLift>
  );
}
