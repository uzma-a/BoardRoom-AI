import { cn } from "@/lib/utils";

export type ProgressBarTone = "primary" | "success" | "warning" | "danger";

interface ProgressBarProps {
  /** 0.0 - 1.0 */
  value: number;
  tone?: ProgressBarTone;
  className?: string;
  "aria-label"?: string;
}

const TONE_CLASSES: Record<ProgressBarTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/** Picks a tone automatically from the value when the caller doesn't have a more specific one (e.g. confidence). */
export function toneForValue(value: number): "success" | "warning" | "danger" {
  if (value >= 0.7) return "success";
  if (value >= 0.4) return "warning";
  return "danger";
}

export function ProgressBar({ value, tone = "primary", className, ...ariaProps }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]", className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      {...ariaProps}
    >
      <div
        className={cn("h-full rounded-full transition-all duration-500 ease-out", TONE_CLASSES[tone])}
        style={{ width: `${clamped * 100}%` }}
      />
    </div>
  );
}
