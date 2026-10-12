interface HowItWorksStepProps {
  number: number;
  title: string;
  description: string;
  isLast?: boolean;
}

export function HowItWorksStep({ number, title, description, isLast = false }: HowItWorksStepProps) {
  return (
    <div className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/40 bg-primary/10 font-mono text-sm font-semibold text-primary">
          {number}
        </span>
        {!isLast && <span className="mt-2 w-px flex-1 bg-border/60" aria-hidden="true" />}
      </div>
      <div className="pb-10">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </div>
  );
}
