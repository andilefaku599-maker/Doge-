import { describe, expect, it } from 'vitest';
import { e1rm, prefill, prFlags, roundTo, suggestNext } from './progression';

const s = (weight: number, reps: number, warmup = false) => ({ weight, reps, warmup });

describe('suggestNext (double progression)', () => {
  it('suggests +2.5 kg when every working set hits the top of the range', () => {
    const r = suggestNext([s(80, 10), s(80, 10), s(80, 10)], 3, 6, 10, 2.5);
    expect(r.kind).toBe('increase');
    expect(r.weight).toBe(82.5);
    expect(r.targetReps).toBe(6);
  });

  it('holds the weight when any set misses the top', () => {
    const r = suggestNext([s(80, 10), s(80, 10), s(80, 8)], 3, 6, 10, 2.5);
    expect(r.kind).toBe('repeat');
    expect(r.weight).toBe(80);
    expect(r.targetReps).toBe(9);
  });

  it('does not progress if fewer sets than planned were done', () => {
    expect(suggestNext([s(80, 10), s(80, 10)], 3, 6, 10, 2.5).kind).toBe('repeat');
  });

  it('uses the exercise increment (machine 5 kg, dumbbell 2 kg)', () => {
    expect(suggestNext([s(50, 12), s(50, 12), s(50, 12)], 3, 8, 12, 5).weight).toBe(55);
    expect(suggestNext([s(22, 12), s(22, 12), s(22, 12)], 3, 8, 12, 2).weight).toBe(24);
  });

  it('only judges sets at the working (heaviest) weight', () => {
    // A lighter back-off set does not block progression.
    const r = suggestNext([s(100, 8), s(100, 8), s(100, 8), s(80, 5)], 3, 6, 8, 2.5);
    expect(r.kind).toBe('increase');
    expect(r.weight).toBe(102.5);
  });

  it('suggests more reps for bodyweight exercises (increment 0)', () => {
    const r = suggestNext([s(0, 12), s(0, 12)], 2, 8, 12, 0);
    expect(r.kind).toBe('increase');
    expect(r.weight).toBe(0);
    expect(r.targetReps).toBe(13);
  });

  it('handles first session', () => {
    expect(suggestNext([], 3, 8, 12, 2.5).kind).toBe('first');
  });

  it('caps target reps at repMax and floors at repMin', () => {
    expect(suggestNext([s(60, 3), s(60, 3), s(60, 3)], 3, 6, 10, 2.5).targetReps).toBe(6);
  });

  it('avoids floating point drift', () => {
    expect(roundTo(0.1 + 0.2 + 82.2, 2.5)).toBe(82.5);
  });
});

describe('prefill', () => {
  const sug = suggestNext([s(80, 10), s(80, 9)], 2, 6, 10, 2.5);
  it('first working set copies last session', () => {
    expect(prefill([s(40, 10, true), s(80, 10), s(80, 9)], [], false, sug, 2.5)).toEqual({ weight: 80, reps: 10 });
  });
  it('uses the increased weight at the bottom of the range after hitting the top', () => {
    const up = suggestNext([s(80, 10), s(80, 10)], 2, 6, 10, 2.5);
    expect(prefill([s(80, 10), s(80, 10)], [], false, up, 2.5)).toEqual({ weight: 82.5, reps: 6 });
  });
  it('later sets follow what was actually done today', () => {
    expect(prefill([s(80, 10)], [s(77.5, 9)], false, sug, 2.5)).toEqual({ weight: 77.5, reps: 9 });
  });
  it('warm-ups come from last session warm-ups, else ~50%', () => {
    expect(prefill([s(40, 10, true), s(80, 10)], [], true, sug, 2.5)).toEqual({ weight: 40, reps: 10 });
    expect(prefill([s(80, 10)], [], true, sug, 2.5)).toEqual({ weight: 40, reps: 10 });
  });
});

describe('personal records', () => {
  const hist = [s(100, 5), s(90, 8), s(60, 20, true)];
  it('flags heaviest weight', () => expect(prFlags(s(102.5, 3), hist).weight).toBe(true));
  it('flags estimated 1RM', () => {
    expect(e1rm(100, 5)).toBeCloseTo(116.67, 1);
    expect(prFlags(s(95, 7), hist).e1rm).toBe(true);
    expect(prFlags(s(90, 6), hist).e1rm).toBe(false);
  });
  it('flags rep PR at a given weight', () => {
    expect(prFlags(s(90, 9), hist).reps).toBe(true);
    expect(prFlags(s(90, 8), hist).reps).toBe(false);
  });
  it('ignores warm-ups and first-ever sessions', () => {
    expect(prFlags(s(200, 1, true), hist)).toEqual({ weight: false, e1rm: false, reps: false });
    expect(prFlags(s(50, 10), [])).toEqual({ weight: false, e1rm: false, reps: false });
  });
});
