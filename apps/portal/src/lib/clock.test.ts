import { describe, expect, it } from 'vitest';
import { fixedClock, systemClock } from './clock';

describe('clocks', () => {
  it('fixedClock returns the same instant and its UTC date every time', () => {
    const clock = fixedClock('2026-11-06T23:59:00Z');
    expect(clock.now().toISOString()).toBe('2026-11-06T23:59:00.000Z');
    expect(clock.today()).toBe('2026-11-06');
    clock.now().setUTCFullYear(2000);
    expect(clock.now().getUTCFullYear()).toBe(2026);
  });

  it('systemClock today is the UTC date of now', () => {
    expect(systemClock.today()).toBe(systemClock.now().toISOString().slice(0, 10));
  });
});
