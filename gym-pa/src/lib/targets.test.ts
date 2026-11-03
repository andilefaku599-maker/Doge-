import { describe, expect, it } from 'vitest';
import { bmr, suggestTargets } from './targets';

describe('targets', () => {
  it('computes Mifflin-St Jeor', () => {
    expect(bmr({ weightKg: 119, heightCm: 160, age: 35, sex: 'male' })).toBe(2020);
  });
  it('gives a moderate recomp deficit and sensible protein', () => {
    const t = suggestTargets({ weightKg: 119, heightCm: 160, age: 35, sex: 'male', goal: 'recomp' });
    expect(t.kcal).toBe(2350);
    expect(t.protein).toBe(180);
    expect(t.tdee - t.kcal).toBeLessThanOrEqual(600);
  });
  it('never suggests an extreme target', () => {
    const t = suggestTargets({ weightKg: 50, heightCm: 150, age: 70, sex: 'male', goal: 'cut' });
    expect(t.kcal).toBeGreaterThanOrEqual(1800);
  });
});
