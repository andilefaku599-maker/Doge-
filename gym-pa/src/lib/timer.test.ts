import { describe, expect, it } from 'vitest';
import { adjust, fmt, isDone, progress, remaining, startRest } from './timer';

describe('rest timer', () => {
  const t0 = 1_700_000_000_000;
  it('counts down from timestamps', () => {
    const r = startRest(t0, 90);
    expect(remaining(r, t0)).toBe(90);
    expect(remaining(r, t0 + 30_400)).toBe(60);
    expect(remaining(r, t0 + 95_000)).toBe(0);
    expect(isDone(r, t0 + 89_999)).toBe(false);
    expect(isDone(r, t0 + 90_000)).toBe(true);
  });
  it('stays correct after the app was backgrounded for a long time', () => {
    const r = startRest(t0, 120);
    expect(remaining(r, t0 + 10 * 60_000)).toBe(0);
    expect(progress(r, t0 + 10 * 60_000)).toBe(1);
  });
  it('adds and removes 15 seconds', () => {
    const r = startRest(t0, 90);
    expect(remaining(adjust(r, 15, t0), t0)).toBe(105);
    expect(remaining(adjust(r, -15, t0), t0)).toBe(75);
  });
  it('never goes negative when subtracting', () => {
    const r = startRest(t0, 10);
    const a = adjust(r, -15, t0 + 5000);
    expect(remaining(a, t0 + 5000)).toBe(0);
    expect(isDone(a, t0 + 5000)).toBe(true);
  });
  it('reports progress', () => {
    const r = startRest(t0, 100);
    expect(progress(r, t0 + 50_000)).toBeCloseTo(0.5);
    expect(progress(undefined, t0)).toBe(1);
  });
  it('formats', () => {
    expect(fmt(90)).toBe('1:30');
    expect(fmt(5)).toBe('0:05');
  });
});
