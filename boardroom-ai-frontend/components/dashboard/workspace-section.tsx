import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WorkspaceSectionProps {
  title: string;
  icon: LucideIcon;
  description?: string;
  /** Optional right-aligned slot — used later for things like an Export button. */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Every dashboard workspace section (Live Board Meeting, Debate Timeline,
 * Board Scorecard, Board Votes, Executive Resolution) shares this exact
 * header treatment. Centralizing it here is what keeps the workspace
 * feeling like one coherent product as more sections are added in later
 * steps, instead of each section inventing its own heading style.
 */
export function WorkspaceSection({ title, icon: Icon, description, action, children, className }: WorkspaceSectionProps) {
  return (
    <section className={cn("rounded-2xl border border-border/60 bg-surface/40 p-5 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {description && <p className="text-xs text-muted">{description}</p>}
          </div>
        </div>
        {action}
      </div>

      <div className="mt-5">{children}</div>
    </section>
  );
}
