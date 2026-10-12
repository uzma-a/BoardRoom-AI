import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, hasError = false, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      suppressHydrationWarning
      aria-invalid={hasError || undefined}
      className={cn(
        "h-11 w-full rounded-xl border bg-surface/60 px-4 text-sm text-foreground",
        "placeholder:text-muted/70",
        "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50",
        hasError ? "border-danger/60" : "border-border focus:border-primary/60",
        className
      )}
      {...props}
    />
  );
});
