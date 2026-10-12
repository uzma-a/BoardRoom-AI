export function ThinkingIndicator() {
  return (
    <span className="inline-flex items-center gap-0.5" role="status" aria-label="Thinking">
      <span className="h-1 w-1 animate-pulse-dot rounded-full bg-primary [animation-delay:0ms]" />
      <span className="h-1 w-1 animate-pulse-dot rounded-full bg-primary [animation-delay:200ms]" />
      <span className="h-1 w-1 animate-pulse-dot rounded-full bg-primary [animation-delay:400ms]" />
    </span>
  );
}
