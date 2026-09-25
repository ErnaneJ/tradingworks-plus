import { describe, expect, it } from 'vitest';
import { pickColumn } from '../../src/lib/tw/parsers/rowMapping';

describe('pickColumn', () => {
  it('returns the value of the first matching candidate', () => {
    expect(pickColumn({ saldo: '+02:15' }, ['saldo', 'balance'])).toBe('+02:15');
    expect(pickColumn({ balance: '+02:15' }, ['saldo', 'balance'])).toBe('+02:15');
  });

  it('returns an empty string when no candidate matches', () => {
    expect(pickColumn({ foo: 'bar' }, ['saldo', 'balance'])).toBe('');
  });

  it('matches a candidate whose value is an empty string, rather than skipping it', () => {
    expect(pickColumn({ saldo: '' }, ['saldo', 'balance'])).toBe('');
  });
});
