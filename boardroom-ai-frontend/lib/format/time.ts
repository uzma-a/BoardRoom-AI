/** Formats a millisecond duration as a short human-readable string, e.g. "4.2s" or "812ms". */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Formats a timestamp as a local clock time, e.g. "3:04:12 PM". */
export function formatClockTime(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * The backend stores timestamps in UTC but SQLite drops the timezone
 * marker, so "2026-10-08T09:42:17.255068" would be misread as local
 * time. Append "Z" when no zone is present, and trim microseconds to
 * milliseconds for consistent parsing across browsers.
 */
export function formatSessionDate(iso: string): string {
  const trimmed = iso.replace(/(\.\d{3})\d+/, "$1");
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const date = new Date(hasZone ? trimmed : `${trimmed}Z`);
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}