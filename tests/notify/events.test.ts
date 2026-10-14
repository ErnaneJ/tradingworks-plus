import { describe, expect, it } from 'vitest';
import { detectDailyAlertEvents, detectEvents } from '../../src/lib/notify/events';
import { DEFAULT_SETTINGS, DEFAULT_STATE, type DispatchLedger, type Settings, type TrackedState } from '../../src/lib/storage/schema';

const TODAY = '2026-09-24';

function state(overrides: Partial<TrackedState> = {}): TrackedState {
  return { ...DEFAULT_STATE, ...overrides };
}

function settings(overrides: Partial<Settings> = {}): Settings {
  return { ...DEFAULT_SETTINGS, ...overrides };
}

function emptyLedger(): DispatchLedger {
  return { date: TODAY, dispatchedEvents: [] };
}

describe('detectEvents — punch edges', () => {
  it('fires punch-in when a new "in" punch appears and the previous status was not on-break', () => {
    const previous = state({ status: 'not-started', punches: [] });
    const next = state({ status: 'working', punches: [{ time: '08:00', kind: 'in' }] });

    const { events } = detectEvents(previous, next, emptyLedger(), settings(), TODAY);

    expect(events).toEqual([{ kind: 'punch-in' }]);
  });

  it('fires break-finished instead of punch-in when returning from a break', () => {
    const previous = state({ status: 'on-break', punches: [{ time: '08:00', kind: 'in' }, { time: '12:00', kind: 'out' }] });
    const next = state({
      status: 'working',
      punches: [
        { time: '08:00', kind: 'in' },
        { time: '12:00', kind: 'out' },
        { time: '13:00', kind: 'in' },
      ],
    });

    const { events } = detectEvents(previous, next, emptyLedger(), settings(), TODAY);

    expect(events).toEqual([{ kind: 'break-finished' }]);
  });

  it('fires punch-out for a new "out" punch', () => {
    const previous = state({ status: 'working', punches: [{ time: '08:00', kind: 'in' }] });
    const next = state({ status: 'on-break', punches: [{ time: '08:00', kind: 'in' }, { time: '12:00', kind: 'out' }] });

    const { events } = detectEvents(previous, next, emptyLedger(), settings(), TODAY);

    expect(events).toEqual([{ kind: 'punch-out' }]);
  });

  it('fires nothing when the punch list is unchanged', () => {
    const same = state({ status: 'working', punches: [{ time: '08:00', kind: 'in' }] });

    const { events } = detectEvents(same, same, emptyLedger(), settings(), TODAY);

    expect(events).toEqual([]);
  });
});

describe('detectEvents — shift-ending-soon', () => {
  const midShift = [{ time: '08:00', kind: 'in' as const }];
  const pastBreak = [
    { time: '08:00', kind: 'in' as const },
    { time: '12:00', kind: 'out' as const },
    { time: '13:00', kind: 'in' as const },
  ];

  it('fires every threshold already crossed, while working without having taken a break yet', () => {
    const previous = state({ status: 'working', punches: midShift });
    const next = state({ status: 'working', workedMinutes: 450, punches: midShift });

    const { events, ledger } = detectEvents(previous, next, emptyLedger(), settings(), TODAY);

    expect(events).toEqual([
      { kind: 'shift-ending-soon', minutesLeft: 60 },
      { kind: 'shift-ending-soon', minutesLeft: 30 },
    ]);
    expect(ledger.dispatchedEvents).toEqual(expect.arrayContaining(['shift-ending-60', 'shift-ending-30']));
  });

  it('does not fire once a break has already been taken', () => {
    const previous = state({ status: 'working', punches: pastBreak });
    const next = state({ status: 'working', workedMinutes: 450, punches: pastBreak });

    const { events } = detectEvents(previous, next, emptyLedger(), settings(), TODAY);

    expect(events).toEqual([]);
  });

  it('dedupes already-dispatched thresholds via the ledger', () => {
    const previous = state({ status: 'working', punches: midShift });
    const next = state({ status: 'working', workedMinutes: 450, punches: midShift });
    const ledger: DispatchLedger = { date: TODAY, dispatchedEvents: ['shift-ending-60', 'shift-ending-30'] };

    const { events } = detectEvents(previous, next, ledger, settings(), TODAY);

    expect(events).toEqual([]);
  });

  it('resets the ledger for a new calendar day', () => {
    const previous = state({ status: 'working', punches: midShift });
    const next = state({ status: 'working', workedMinutes: 450, punches: midShift });
    const staleLedger: DispatchLedger = { date: '2026-09-23', dispatchedEvents: ['shift-ending-60', 'shift-ending-30'] };

    const { events } = detectEvents(previous, next, staleLedger, settings(), TODAY);

    expect(events).toEqual([
      { kind: 'shift-ending-soon', minutesLeft: 60 },
      { kind: 'shift-ending-soon', minutesLeft: 30 },
    ]);
  });
});

describe('detectEvents — break-ending-soon', () => {
  it('fires every threshold already crossed for the open break, keyed by its start time', () => {
    const previous = state({ status: 'on-break' });
    const next = state({
      status: 'on-break',
      intervals: [{ start: '12:00', end: null, kind: 'break', durationMinutes: 50 }],
    });

    const { events, ledger } = detectEvents(previous, next, emptyLedger(), settings({ breakDurationMinutes: 60 }), TODAY);

    expect(events).toEqual([
      { kind: 'break-ending-soon', minutesLeft: 15 },
      { kind: 'break-ending-soon', minutesLeft: 10 },
    ]);
    expect(ledger.dispatchedEvents).toEqual(expect.arrayContaining(['break-ending-12:00-15', 'break-ending-12:00-10']));
  });
});

describe('detectEvents — shift-finished', () => {
  it('fires once when the shift transitions into finished (on-break + goal met)', () => {
    const previous = state({ status: 'working', workedMinutes: 470 });
    const next = state({ status: 'on-break', workedMinutes: 480 });

    const { events } = detectEvents(previous, next, emptyLedger(), settings(), TODAY);

    expect(events).toEqual([{ kind: 'shift-finished' }]);
  });

  it('does not re-fire once already finished', () => {
    const previous = state({ status: 'on-break', workedMinutes: 480 });
    const next = state({ status: 'on-break', workedMinutes: 485 });

    const { events } = detectEvents(previous, next, emptyLedger(), settings(), TODAY);

    expect(events).toEqual([]);
  });
});

describe('detectEvents — overtime-threshold', () => {
  const pastBreak = [
    { time: '08:00', kind: 'in' as const },
    { time: '12:00', kind: 'out' as const },
    { time: '13:00', kind: 'in' as const },
  ];

  it('fires all crossed base thresholds at once', () => {
    const previous = state({ status: 'working', punches: pastBreak });
    const next = state({ status: 'working', workedMinutes: 480 + 30, punches: pastBreak });

    const { events } = detectEvents(previous, next, emptyLedger(), settings(), TODAY);

    expect(events).toEqual([
      { kind: 'overtime-threshold', minutes: 15 },
      { kind: 'overtime-threshold', minutes: 30 },
    ]);
  });

  it('only fires the newly crossed threshold on a later poll', () => {
    const previous = state({ status: 'working', workedMinutes: 480 + 30, punches: pastBreak });
    const next = state({ status: 'working', workedMinutes: 480 + 90, punches: pastBreak });
    const ledger: DispatchLedger = { date: TODAY, dispatchedEvents: ['overtime-15', 'overtime-30'] };

    const { events } = detectEvents(previous, next, ledger, settings(), TODAY);

    expect(events).toEqual([{ kind: 'overtime-threshold', minutes: 60 }]);
  });
});

describe('detectDailyAlertEvents', () => {
  it('fires nothing outside the 10:00-10:14 window', () => {
    const next = state({ attendanceAlerts: [{ id: 'a1', label: 'Overtime to approve', count: 2, href: '#' }] });

    const { events } = detectDailyAlertEvents(next, emptyLedger(), TODAY, 9 * 60);

    expect(events).toEqual([]);
  });

  it('fires one event per non-zero alert inside the window', () => {
    const next = state({
      attendanceAlerts: [
        { id: 'a1', label: 'Overtime to approve', count: 2, href: '#' },
        { id: 'a2', label: 'Nothing pending', count: 0, href: '#' },
      ],
    });

    const { events, ledger } = detectDailyAlertEvents(next, emptyLedger(), TODAY, 10 * 60 + 5);

    expect(events).toEqual([{ kind: 'attendance-alert', label: 'Overtime to approve', count: 2 }]);
    expect(ledger.dispatchedEvents).toContain('attendance-alert-a1');
  });

  it('does not re-fire the same alert twice in one day', () => {
    const next = state({ attendanceAlerts: [{ id: 'a1', label: 'Overtime to approve', count: 2, href: '#' }] });
    const ledger: DispatchLedger = { date: TODAY, dispatchedEvents: ['attendance-alert-a1'] };

    const { events } = detectDailyAlertEvents(next, ledger, TODAY, 10 * 60 + 5);

    expect(events).toEqual([]);
  });
});
