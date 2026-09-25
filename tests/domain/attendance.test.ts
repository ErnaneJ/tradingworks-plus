import { describe, expect, it } from 'vitest';
import { computeIntervals, computeStatus, inferPunchKinds, sumMinutes } from '../../src/lib/domain/attendance';

describe('inferPunchKinds', () => {
  it('alternates in/out starting with in', () => {
    expect(inferPunchKinds(['08:00', '12:00', '13:00', '17:00'])).toEqual([
      { time: '08:00', kind: 'in' },
      { time: '12:00', kind: 'out' },
      { time: '13:00', kind: 'in' },
      { time: '17:00', kind: 'out' },
    ]);
  });

  it('handles an odd number of punches (still clocked in)', () => {
    expect(inferPunchKinds(['08:00'])).toEqual([{ time: '08:00', kind: 'in' }]);
  });
});

describe('computeIntervals', () => {
  it('builds closed worked/break intervals between consecutive punches', () => {
    const punches = inferPunchKinds(['08:00', '12:00', '13:00', '17:00']);
    const intervals = computeIntervals(punches, timeToMinutesFixture('18:00'));

    expect(intervals).toEqual([
      { start: '08:00', end: '12:00', kind: 'worked', durationMinutes: 240 },
      { start: '12:00', end: '13:00', kind: 'break', durationMinutes: 60 },
      { start: '13:00', end: '17:00', kind: 'worked', durationMinutes: 240 },
      { start: '17:00', end: null, kind: 'break', durationMinutes: 60 },
    ]);
  });

  it('omits the trailing open interval when the day is marked finished', () => {
    const punches = inferPunchKinds(['08:00', '12:00', '13:00', '17:00']);
    const intervals = computeIntervals(punches, timeToMinutesFixture('18:00'), true);

    expect(intervals).toEqual([
      { start: '08:00', end: '12:00', kind: 'worked', durationMinutes: 240 },
      { start: '12:00', end: '13:00', kind: 'break', durationMinutes: 60 },
      { start: '13:00', end: '17:00', kind: 'worked', durationMinutes: 240 },
    ]);
  });

  it('leaves the last interval open (end: null) when there is no closing punch', () => {
    const punches = inferPunchKinds(['08:00']);
    const intervals = computeIntervals(punches, timeToMinutesFixture('09:30'));

    expect(intervals).toEqual([{ start: '08:00', end: null, kind: 'worked', durationMinutes: 90 }]);
  });

  it('never returns a negative duration for the open interval', () => {
    const punches = inferPunchKinds(['08:00']);
    const intervals = computeIntervals(punches, timeToMinutesFixture('07:00'));

    expect(intervals[0].durationMinutes).toBe(0);
  });
});

describe('sumMinutes', () => {
  it('sums only intervals of the requested kind', () => {
    const intervals = computeIntervals(inferPunchKinds(['08:00', '12:00', '13:00', '17:00']), timeToMinutesFixture('17:00'));
    expect(sumMinutes(intervals, 'worked')).toBe(480);
    expect(sumMinutes(intervals, 'break')).toBe(60);
  });
});

describe('computeStatus', () => {
  it('prefers an explicit finished label over punch parity', () => {
    expect(computeStatus(inferPunchKinds(['08:00']), 'Encerrado')).toBe('finished');
  });

  it('recognizes an explicit break label', () => {
    expect(computeStatus(inferPunchKinds(['08:00']), 'Em intervalo')).toBe('on-break');
  });

  it('falls back to punch-count parity when there is no explicit label', () => {
    expect(computeStatus([], null)).toBe('not-started');
    expect(computeStatus(inferPunchKinds(['08:00']), null)).toBe('working');
    expect(computeStatus(inferPunchKinds(['08:00', '12:00']), null)).toBe('on-break');
  });

  it('treats an even punch count with no label as still on break when under the daily goal', () => {
    expect(computeStatus(inferPunchKinds(['08:00', '12:00']), null, 240, 480)).toBe('on-break');
  });

  it('treats an even punch count with no label as finished once the daily goal is met', () => {
    expect(computeStatus(inferPunchKinds(['08:00', '12:00']), null, 480, 480)).toBe('finished');
    expect(computeStatus(inferPunchKinds(['08:00', '12:00']), null, 500, 480)).toBe('finished');
  });
});

function timeToMinutesFixture(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
