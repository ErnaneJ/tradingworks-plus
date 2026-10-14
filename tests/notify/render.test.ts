import { describe, expect, it } from 'vitest';
import { translatorFor } from '../../src/lib/i18n';
import { renderEvent } from '../../src/lib/notify/render';
import type { NotificationEvent } from '../../src/lib/notify/events';

const t = translatorFor('en');

describe('renderEvent', () => {
  it('renders settings-changed', () => {
    expect(renderEvent({ kind: 'settings-changed' }, t)).toEqual({
      title: 'TradingWorks+',
      body: 'Your TradingWorks+ settings were updated.',
    });
  });

  it('renders punch-in and punch-out', () => {
    expect(renderEvent({ kind: 'punch-in' }, t).body).toBe("You've clocked in.");
    expect(renderEvent({ kind: 'punch-out' }, t).body).toBe("You've clocked out.");
  });

  it('renders break-finished', () => {
    expect(renderEvent({ kind: 'break-finished' }, t).body).toBe('Your break is over. Back to work.');
  });

  it('renders shift-ending-soon with interpolated minutes', () => {
    const event: NotificationEvent = { kind: 'shift-ending-soon', minutesLeft: 30 };
    expect(renderEvent(event, t).body).toBe('30 minutes left to reach your expected hours.');
  });

  it('renders break-ending-soon with interpolated minutes', () => {
    const event: NotificationEvent = { kind: 'break-ending-soon', minutesLeft: 5 };
    expect(renderEvent(event, t).body).toBe('5 minutes left on your break.');
  });

  it('renders shift-finished with a distinct title', () => {
    expect(renderEvent({ kind: 'shift-finished' }, t)).toEqual({
      title: 'Shift complete',
      body: "You've reached your expected hours for today.",
    });
  });

  it('renders overtime-threshold with interpolated minutes', () => {
    const event: NotificationEvent = { kind: 'overtime-threshold', minutes: 60 };
    expect(renderEvent(event, t).body).toBe('You are 60 minutes into overtime.');
  });

  it('renders attendance-alert with interpolated label and count', () => {
    const event: NotificationEvent = { kind: 'attendance-alert', label: 'Overtime to approve', count: 3 };
    expect(renderEvent(event, t).body).toBe('Overtime to approve (3)');
  });
});
