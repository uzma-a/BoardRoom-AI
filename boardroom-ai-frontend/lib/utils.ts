import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class names and resolves Tailwind class conflicts
 * (e.g. `cn("p-4", condition && "p-2")` correctly keeps only "p-2").
 * Used by every component in components/ui/ and beyond instead of
 * hand-concatenating className strings.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
