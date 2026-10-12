import { ProgressBar, toneForValue } from "@/components/ui/progress-bar";

interface ScorecardMetricProps {
  label: string;
  value: number; // 0.0 - 1.0
}

export function ScorecardMetric({ label, value }: ScorecardMetricProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-sm text-foreground">{label}</span>
        <span className="font-mono text-sm font-medium text-muted">{Math.round(value * 100)}%</span>
      </div>
      <ProgressBar value={value} tone={toneForValue(value)} aria-label={label} />
    </div>
  );
}
