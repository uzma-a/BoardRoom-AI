import { ProgressBar, toneForValue } from "@/components/ui/progress-bar";

interface ConfidenceMeterProps {
  confidence: number; // 0.0 - 1.0
}

export function ConfidenceMeter({ confidence }: ConfidenceMeterProps) {
  const percent = Math.round(confidence * 100);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-xs text-muted">Confidence</span>
        <span className="font-mono text-xs font-medium text-foreground">{percent}%</span>
      </div>
      <ProgressBar value={confidence} tone={toneForValue(confidence)} aria-label="Confidence" />
    </div>
  );
}
