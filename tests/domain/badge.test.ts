import { describe, expect, it } from 'vitest';
import { computeBadge } from '../../src/lib/domain/badge';

describe('computeBadge', () => {
  it('shows the working dot while working', () => {
    expect(computeBadge('working', 100, 480)).toEqual({ text: '●', color: '#a7bf31' });
  });

  it('shows "zzz" while on a break before the daily goal is met', () => {
    expect(computeBadge('on-break', 300, 480)).toEqual({ text: 'zzz', color: '#e08c2b' });
  });

  it('shows no badge on a break once the daily goal is already met', () => {
    expect(computeBadge('on-break', 480, 480).text).toBe('');
  });

  it('shows no badge when finished', () => {
    expect(computeBadge('finished', 500, 480).text).toBe('');
  });

  it('shows no badge when not started, not logged in, disabled or checking', () => {
    expect(computeBadge('not-started', 0, 480).text).toBe('');
    expect(computeBadge('not-logged-in', 0, 480).text).toBe('');
    expect(computeBadge('disabled', 0, 480).text).toBe('');
    expect(computeBadge('checking', 0, 480).text).toBe('');
  });
});
