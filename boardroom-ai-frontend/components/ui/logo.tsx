import Link from "next/link";
import { Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  /** Compact mark only, no wordmark — used in the collapsed dashboard sidebar rail. */
  iconOnly?: boolean;
  className?: string;
}

/**
 * The Landmark glyph (a classical, columned building) is deliberate: it
 * reads as institutional governance/authority — a board convening — a
 * closer visual match for "AI Board of Directors" than a generic chip,
 * spark, or bot-head icon most AI products default to.
 */
export function Logo({ iconOnly = false, className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2.5 rounded-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      aria-label="Boardroom AI — home"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
        <Landmark className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </span>
      {!iconOnly && (
        <span className="font-semibold tracking-tight text-foreground">
          Boardroom<span className="text-primary-text">AI</span>
        </span>
      )}
    </Link>
  );
}
