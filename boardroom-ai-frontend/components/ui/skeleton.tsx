import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

/** A shimmering placeholder for content whose shape is known but whose values aren't ready yet. */
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-white/[0.06]", className)}
      role="presentation"
      aria-hidden="true"
    />
  );
}
