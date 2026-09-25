import type { DayInterval, PunchEntry, WorkStatus } from '../storage/schema';
import { timeToMinutes } from './time';

/**
 * TradingWorks doesn't label punches as "in" or "out": it just lists times.
 * The convention (also used by the platform itself) is that punches
 * alternate, starting with a clock-in: 1st = in, 2nd = out (break start),
 * 3rd = in (break end), 4th = out (day end), and so on for extra breaks.
 */
export function inferPunchKinds(times: string[]): PunchEntry[] {
  return times.map((time, index) => ({ time, kind: index % 2 === 0 ? 'in' : 'out' }));
}

/**
 * Builds the alternating worked/break intervals for the day from a list of punches.
 * The last punch only gets a synthesized open-ended interval (running up to `nowMinutes`)
 * when the day isn't finished yet — a closed day (explicit "finished" status) must not
 * show a phantom trailing segment after the final punch.
 */
export function computeIntervals(punches: PunchEntry[], nowMinutes: number, isFinished = false): DayInterval[] {
  const intervals: DayInterval[] = [];

  for (let index = 0; index < punches.length; index += 1) {
    const start = punches[index].time;
    const next = punches[index + 1];
    const kind = index % 2 === 0 ? 'worked' : 'break';
    const startMinutes = timeToMinutes(start);

    if (next) {
      const endMinutes = timeToMinutes(next.time);
      const duration = startMinutes !== null && endMinutes !== null ? endMinutes - startMinutes : null;
      intervals.push({ start, end: next.time, kind, durationMinutes: duration });
    } else if (!isFinished) {
      const duration = startMinutes !== null ? Math.max(nowMinutes - startMinutes, 0) : null;
      intervals.push({ start, end: null, kind, durationMinutes: duration });
    }
  }

  return intervals;
}

export function sumMinutes(intervals: DayInterval[], kind: DayInterval['kind']): number {
  return intervals
    .filter((interval) => interval.kind === kind)
    .reduce((total, interval) => total + (interval.durationMinutes ?? 0), 0);
}

/**
 * Derives the current status from the punch count. Prefers an explicit
 * status label scraped from the page when TradingWorks provides one
 * (e.g. "Encerrado"), since that also captures shifts that finished with
 * an odd number of punches or other edge cases parity alone can't see.
 *
 * TradingWorks sometimes renders that label as an empty badge (no text)
 * once a shift's periods are all closed but the next one hasn't started —
 * parity alone would then read as "on-break" forever, even long after the
 * configured daily goal was met. `workedMinutes`/`dailyRequiredWorkMinutes`
 * let that fallback resolve to "finished" once the goal is reached, instead
 * of showing an indefinite break.
 */
export function computeStatus(
  punches: PunchEntry[],
  explicitLabel?: string | null,
  workedMinutes = 0,
  dailyRequiredWorkMinutes = Infinity,
): WorkStatus {
  if (explicitLabel) {
    const normalized = explicitLabel.toLowerCase();
    if (/(encerr|finaliz|finish)/.test(normalized)) return 'finished';
    if (/(intervalo|almoco|break)/.test(normalized)) return 'on-break';
    if (/(trabalh|working)/.test(normalized)) return 'working';
  }

  if (punches.length === 0) return 'not-started';
  if (punches.length % 2 === 1) return 'working';
  return workedMinutes >= dailyRequiredWorkMinutes ? 'finished' : 'on-break';
}
