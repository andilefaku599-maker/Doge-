import type { Profile } from './types';

/** Mifflin-St Jeor BMR (kcal/day). */
export const bmr = (p: Pick<Profile, 'weightKg' | 'heightCm' | 'age' | 'sex'>) =>
  10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);

/**
 * Conservative starting targets. Activity factor 1.45 (lifting 3–4x/week, desk job).
 * Recomp at a higher body weight = moderate deficit (~20%, capped at 600 kcal).
 * Floors prevent extreme targets: 1800 kcal (men) / 1500 kcal (women).
 * Protein ~1.5 g/kg body weight, capped at 220 g; at higher body fat this is ample.
 */
export function suggestTargets(p: Pick<Profile, 'weightKg' | 'heightCm' | 'age' | 'sex' | 'goal'>) {
  const tdee = bmr(p) * 1.45;
  const adj =
    p.goal === 'cut' ? -Math.min(700, tdee * 0.22)
    : p.goal === 'recomp' ? -Math.min(600, tdee * 0.2)
    : p.goal === 'bulk' ? 250
    : 0;
  const floor = p.sex === 'male' ? 1800 : 1500;
  const kcal = Math.max(floor, Math.round((tdee + adj) / 50) * 50);
  const protein = Math.min(220, Math.round((p.weightKg * 1.5) / 5) * 5);
  return { tdee: Math.round(tdee), kcal, protein };
}
