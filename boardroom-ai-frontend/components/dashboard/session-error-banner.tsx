import { AlertTriangle } from "lucide-react";

interface SessionErrorBannerProps {
  message: string;
}

export function SessionErrorBanner({ message }: SessionErrorBannerProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-danger/40 bg-danger/[0.06] px-4 py-3.5" role="alert">
      <AlertTriangle className="h-4 w-4 shrink-0 text-danger" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-foreground">The board session hit a problem</p>
        <p className="mt-0.5 text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
