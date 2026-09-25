import type { DispatchLedger, Settings, TrackedState, WorkStatus } from '../storage/schema';

export interface SettingsChangedEvent {
  kind: 'settings-changed';
}
export interface PunchInEvent {
  kind: 'punch-in';
}
export interface PunchOutEvent {
  kind: 'punch-out';
}
export interface BreakFinishedEvent {
  kind: 'break-finished';
}
export interface ShiftEndingSoonEvent {
  kind: 'shift-ending-soon';
  minutesLeft: number;
}
export interface BreakEndingSoonEvent {
  kind: 'break-ending-soon';
  minutesLeft: number;
}
export interface ShiftFinishedEvent {
  kind: 'shift-finished';
}
export interface OvertimeThresholdEvent {
  kind: 'overtime-threshold';
  minutes: number;
}
export interface AttendanceAlertEvent {
  kind: 'attendance-alert';
  label: string;
  count: number;
}

export type NotificationEvent =
  | SettingsChangedEvent
  | PunchInEvent
  | PunchOutEvent
  | BreakFinishedEvent
  | ShiftEndingSoonEvent
  | BreakEndingSoonEvent
  | ShiftFinishedEvent
  | OvertimeThresholdEvent
  | AttendanceAlertEvent;

/** Descending so the highest threshold already crossed fires instead of the lowest. */
const SHIFT_ENDING_THRESHOLDS = [60, 30, 15];
const BREAK_ENDING_THRESHOLDS = [15, 10, 5, 1];
const OVERTIME_BASE_THRESHOLDS = [15, 30, 60];
const OVERTIME_STEP_MINUTES = 60;
const DAILY_ALERT_WINDOW_START_MINUTES = 10 * 60;
const DAILY_ALERT_WINDOW_END_MINUTES = 10 * 60 + 14;

function withDispatched(ledger: DispatchLedger, id: string): DispatchLedger {
  return { ...ledger, dispatchedEvents: [...ledger.dispatchedEvents, id] };
}

function freshLedger(ledger: DispatchLedger, today: string): DispatchLedger {
  return ledger.date === today ? ledger : { date: today, dispatchedEvents: [] };
}

/** True once the shift is over: on a break, having already worked the full expected day. */
function isShiftFinished(status: WorkStatus, workedMinutes: number, dailyRequiredWorkMinutes: number): boolean {
  return status === 'on-break' && workedMinutes >= dailyRequiredWorkMinutes;
}

/**
 * Detects the punch-driven and time-driven events from the fast poll
 * (every `pollingIntervalMinutes`): punch-in/out, break-finished,
 * shift-ending-soon, break-ending-soon, shift-finished and overtime
 * thresholds. All are deduplicated per calendar day via the dispatch
 * ledger, keyed so a threshold re-fires for each new break instance or
 * overtime step.
 */
export function detectEvents(
  previous: TrackedState,
  next: TrackedState,
  ledger: DispatchLedger,
  settings: Settings,
  today: string,
): { events: NotificationEvent[]; ledger: DispatchLedger } {
  const events: NotificationEvent[] = [];
  let working = freshLedger(ledger, today);

  const dispatch = (id: string, event: NotificationEvent) => {
    if (working.dispatchedEvents.includes(id)) return;
    events.push(event);
    working = withDispatched(working, id);
  };

  // Punch-in / punch-out / break-finished: edge-triggered whenever a new punch appears.
  if (next.punches.length > previous.punches.length) {
    const newPunch = next.punches[next.punches.length - 1];
    if (newPunch.kind === 'in') {
      if (previous.status === 'on-break') {
        events.push({ kind: 'break-finished' });
      } else {
        events.push({ kind: 'punch-in' });
      }
    } else {
      events.push({ kind: 'punch-out' });
    }
  }

  const hasTakenBreak = next.punches.length >= 2;
  if (next.status === 'working' && !hasTakenBreak) {
    const remaining = settings.dailyRequiredWorkMinutes - next.workedMinutes;
    for (const threshold of SHIFT_ENDING_THRESHOLDS) {
      if (remaining <= threshold) {
        dispatch(`shift-ending-${threshold}`, { kind: 'shift-ending-soon', minutesLeft: threshold });
      }
    }
  }

  if (next.status === 'on-break') {
    const openBreak = next.intervals.find((interval) => interval.kind === 'break' && interval.end === null);
    if (openBreak && openBreak.durationMinutes !== null) {
      const remaining = settings.breakDurationMinutes - openBreak.durationMinutes;
      for (const threshold of BREAK_ENDING_THRESHOLDS) {
        if (remaining <= threshold) {
          dispatch(`break-ending-${openBreak.start}-${threshold}`, { kind: 'break-ending-soon', minutesLeft: threshold });
        }
      }
    }
  }

  const wasFinished = isShiftFinished(previous.status, previous.workedMinutes, settings.dailyRequiredWorkMinutes);
  const isFinished = isShiftFinished(next.status, next.workedMinutes, settings.dailyRequiredWorkMinutes);
  if (isFinished && !wasFinished) {
    dispatch('shift-finished', { kind: 'shift-finished' });
  }

  if (next.status === 'working' || next.status === 'on-break') {
    const overtimeMinutes = next.workedMinutes - settings.dailyRequiredWorkMinutes;
    if (overtimeMinutes >= OVERTIME_BASE_THRESHOLDS[0]) {
      const thresholds = [...OVERTIME_BASE_THRESHOLDS];
      let step = OVERTIME_STEP_MINUTES + OVERTIME_BASE_THRESHOLDS[OVERTIME_BASE_THRESHOLDS.length - 1];
      while (step <= overtimeMinutes + OVERTIME_STEP_MINUTES) {
        thresholds.push(step);
        step += OVERTIME_STEP_MINUTES;
      }
      for (const threshold of thresholds) {
        if (overtimeMinutes >= threshold) {
          dispatch(`overtime-${threshold}`, { kind: 'overtime-threshold', minutes: threshold });
        }
      }
    }
  }

  return { events, ledger: working };
}

/**
 * Detects the once-a-day, ~10:00 "Alertas sobre apontamentos" events from
 * the history poll (every 15 minutes) — no dedicated alarm needed since
 * this alarm already fires inside the 10:00-10:14 window every day.
 */
export function detectDailyAlertEvents(
  next: TrackedState,
  ledger: DispatchLedger,
  today: string,
  nowMinutes: number,
): { events: NotificationEvent[]; ledger: DispatchLedger } {
  let working = freshLedger(ledger, today);
  if (nowMinutes < DAILY_ALERT_WINDOW_START_MINUTES || nowMinutes > DAILY_ALERT_WINDOW_END_MINUTES) {
    return { events: [], ledger: working };
  }

  const events: NotificationEvent[] = [];
  for (const alert of next.attendanceAlerts) {
    if (alert.count <= 0) continue;
    const id = `attendance-alert-${alert.id}`;
    if (working.dispatchedEvents.includes(id)) continue;
    events.push({ kind: 'attendance-alert', label: alert.label, count: alert.count });
    working = withDispatched(working, id);
  }

  return { events, ledger: working };
}
