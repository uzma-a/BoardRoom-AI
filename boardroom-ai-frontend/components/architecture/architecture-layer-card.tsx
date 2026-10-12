import type { LucideIcon } from "lucide-react";

interface ArchitectureLayerCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function ArchitectureLayerCard({ icon: Icon, title, description }: ArchitectureLayerCardProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted">{description}</p>
    </div>
  );
}
