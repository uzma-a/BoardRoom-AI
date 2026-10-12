import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, hasError = false, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      suppressHydrationWarning
      aria-invalid={hasError || undefined}
      className={cn(
        "w-full resize-none rounded-xl border bg-surface/60 px-4 py-3.5 text-sm leading-relaxed text-foreground",
        "placeholder:text-muted/70",
        "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary/50",
        hasError ? "border-danger/60" : "border-border focus:border-primary/60",
        className
      )}
      {...props}
    />
  );
});
