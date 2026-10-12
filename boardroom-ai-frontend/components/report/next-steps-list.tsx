import { ArrowRight } from "lucide-react";

interface NextStepsListProps {
  steps: string[];
}

export function NextStepsList({ steps }: NextStepsListProps) {
  if (steps.length === 0) {
    return <p className="text-sm text-muted">The board did not specify next steps for this session.</p>;
  }

  return (
    <ol className="space-y-3">
      {steps.map((step, index) => (
        <li key={index} className="flex items-start gap-3">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </span>
          <span className="text-sm leading-relaxed text-muted">{step}</span>
        </li>
      ))}
    </ol>
  );
}
