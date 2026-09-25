import type { WorkStatus } from '../storage/schema';

export interface Badge {
  text: string;
  color: string;
}

const WORKING_BADGE: Badge = { text: '●', color: '#a7bf31' };
const RESTING_BADGE: Badge = { text: 'zzz', color: '#e08c2b' };
const NONE_BADGE: Badge = { text: '', color: '#000000' };

/**
 * Icon badge for the current status: a dot while working, "zzz" while on a
 * break before the daily goal is met, and no badge otherwise (finished,
 * not started, not logged in, disabled, checking).
 */
export function computeBadge(status: WorkStatus, workedMinutes: number, dailyRequiredWorkMinutes: number): Badge {
  if (status === 'working') return WORKING_BADGE;
  if (status === 'on-break' && workedMinutes < dailyRequiredWorkMinutes) return RESTING_BADGE;
  return NONE_BADGE;
}
