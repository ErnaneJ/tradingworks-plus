import { describe, expect, it } from 'vitest';
import {
  formatDurationHM,
  formatDurationHMm,
  formatRelativeTime,
  minutesBetween,
  minutesToTime,
  parseSignedBalance,
  timeToMinutes,
} from '../../src/lib/domain/time';

describe('timeToMinutes', () => {
  it('parses HH:mm into minutes since midnight', () => {
    expect(timeToMinutes('08:30')).toBe(510);
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('23:59')).toBe(1439);
  });

  it('parses HH:mm:ss by ignoring the seconds', () => {
    expect(timeToMinutes('08:30:45')).toBe(510);
  });

  it('returns null for unparseable input', () => {
    expect(timeToMinutes('not a time')).toBeNull();
    expect(timeToMinutes('')).toBeNull();
  });
});

describe('minutesToTime', () => {
  it('formats positive minute counts as HH:mm', () => {
    expect(minutesToTime(510)).toBe('08:30');
    expect(minutesToTime(0)).toBe('00:00');
  });

  it('formats negative minute counts with a leading sign', () => {
    expect(minutesToTime(-90)).toBe('-01:30');
  });

  it('rounds fractional minutes', () => {
    expect(minutesToTime(90.6)).toBe('01:31');
  });
});

describe('formatDurationHM', () => {
  it('formats a minute count as zero-padded HHhMM', () => {
    expect(formatDurationHM(60)).toBe('01h00');
    expect(formatDurationHM(24)).toBe('00h24');
    expect(formatDurationHM(232)).toBe('03h52');
  });

  it('rounds fractional minutes', () => {
    expect(formatDurationHM(90.6)).toBe('01h31');
  });
});

describe('formatDurationHMm', () => {
  it('formats a minute count as zero-padded HHhMMm', () => {
    expect(formatDurationHMm(207)).toBe('03h27m');
    expect(formatDurationHMm(24)).toBe('00h24m');
  });
});

describe('parseSignedBalance', () => {
  it('parses an explicit positive sign', () => {
    expect(parseSignedBalance('+02:15')).toBe(135);
  });

  it('parses an explicit negative sign', () => {
    expect(parseSignedBalance('-00:45')).toBe(-45);
  });

  it('treats an unsigned value as positive', () => {
    expect(parseSignedBalance('02:15')).toBe(135);
  });

  it('returns null for empty input', () => {
    expect(parseSignedBalance('')).toBeNull();
    expect(parseSignedBalance('   ')).toBeNull();
  });
});

describe('minutesBetween', () => {
  it('computes the difference between two same-day times', () => {
    expect(minutesBetween('08:00', '12:00')).toBe(240);
  });

  it('wraps past midnight when the end time is earlier than the start time', () => {
    expect(minutesBetween('23:00', '01:00')).toBe(120);
  });

  it('returns null when either time is unparseable', () => {
    expect(minutesBetween('bad', '12:00')).toBeNull();
  });
});

describe('formatRelativeTime', () => {
  it('formats sub-minute durations in seconds', () => {
    expect(formatRelativeTime(1000, 1000 + 5000)).toBe('5s');
  });

  it('formats longer durations in minutes', () => {
    expect(formatRelativeTime(0, 3 * 60_000)).toBe('3m');
  });

  it('never returns a negative duration for a fromMs in the future', () => {
    expect(formatRelativeTime(5000, 1000)).toBe('0s');
  });
});
