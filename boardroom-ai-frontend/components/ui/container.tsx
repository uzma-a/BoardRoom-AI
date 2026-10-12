import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Narrower max-width for reading-focused content (About page prose, etc). */
  narrow?: boolean;
}

/**
 * Consistent horizontal rhythm for every marketing page. Centralizing
 * max-width + padding here is what keeps alignment perfectly consistent
 * across Landing/Architecture/About instead of each page guessing its
 * own values (a common source of the "slightly off" feeling in
 * AI-generated layouts).
 */
export function Container({ narrow = false, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-6 lg:px-8",
        narrow ? "max-w-3xl" : "max-w-7xl",
        className
      )}
      {...props}
    />
  );
}
