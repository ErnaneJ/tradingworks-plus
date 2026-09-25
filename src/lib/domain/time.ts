/** Parses "HH:mm" (or "HH:mm:ss") into total minutes since midnight. */
export function timeToMinutes(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

/** Formats a minute count as "HH:mm", supporting negative values ("-01:30"). */
export function minutesToTime(totalMinutes: number): string {
  const sign = totalMinutes < 0 ? '-' : '';
  const abs = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Formats a minute count as "HHhMM" (e.g. "01h00", "00h24"), for compact duration labels. */
export function formatDurationHM(totalMinutes: number): string {
  const abs = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}`;
}

/** Formats a minute count as "HHhMMm" (e.g. "03h27m"), matching TradingWorks' own duration display. */
export function formatDurationHMm(totalMinutes: number): string {
  const abs = Math.abs(Math.round(totalMinutes));
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return `${String(hours).padStart(2, '0')}h${String(minutes).padStart(2, '0')}m`;
}

/**
 * Parses a signed balance string as used across TradingWorks' payroll pages,
 * e.g. "+02:15", "-00:45", "02:15". Returns signed minutes.
 */
export function parseSignedBalance(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const negative = trimmed.startsWith('-');
  const digitsOnly = trimmed.replace(/^[+-]/, '');
  const minutes = timeToMinutes(digitsOnly);
  if (minutes === null) return null;
  return negative ? -minutes : minutes;
}

/** Short relative-time string ("5s", "3m") for "last updated N ago" labels. */
export function formatRelativeTime(fromMs: number, nowMs: number): string {
  const diffSeconds = Math.max(Math.round((nowMs - fromMs) / 1000), 0);
  if (diffSeconds < 60) return `${diffSeconds}s`;
  const diffMinutes = Math.round(diffSeconds / 60);
  return `${diffMinutes}m`;
}

export function minutesBetween(startTime: string, endTime: string): number | null {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null) return null;
  return end >= start ? end - start : 24 * 60 - start + end;
}
