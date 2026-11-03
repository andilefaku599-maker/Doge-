import type { SetLog } from './types';

export interface Suggestion {
  /** Weight to prefill for working sets next session. */
  weight: number;
  /** Rep target to aim for. */
  targetReps: number;
  kind: 'increase' | 'repeat' | 'first';
  reason: string;
}

/** Rounds to the nearest increment step (avoids 82.49999 style floats). */
export const roundTo = (value: number, step: number) =>
  step > 0 ? Math.round(value / step) * step : value;

/**
 * Double progression. Work inside a rep range at a fixed weight; once every working
 * set reaches the top of the range, add the smallest sensible increment and drop back
 * to the bottom of the range.
 *
 * `lastWorking` is the previous session's working (non-warm-up) sets for this exercise.
 */
export function suggestNext(
  lastWorking: Pick<SetLog, 'weight' | 'reps'>[],
  plannedSets: number,
  repMin: number,
  repMax: number,
  increment: number,
): Suggestion {
  if (lastWorking.length === 0) {
    return { weight: 0, targetReps: repMin, kind: 'first', reason: 'First time: pick a weight you can do for ' + repMin + '–' + repMax + ' clean reps.' };
  }
  // Use the heaviest weight used across working sets as the "working weight".
  const weight = Math.max(...lastWorking.map((s) => s.weight));
  const atWeight = lastWorking.filter((s) => s.weight === weight);
  const enoughSets = atWeight.length >= plannedSets;
  const allTop = atWeight.every((s) => s.reps >= repMax);

  if (enoughSets && allTop) {
    if (increment <= 0) {
      return { weight, targetReps: repMax + 1, kind: 'increase', reason: `Hit ${repMax} on all sets. Add a rep, or add load if you can.` };
    }
    const next = roundTo(weight + increment, increment);
    return { weight: next, targetReps: repMin, kind: 'increase', reason: `Hit ${repMax} reps on all ${atWeight.length} sets last time. Go up ${increment} kg.` };
  }
  const lowest = Math.min(...atWeight.map((s) => s.reps));
  const target = Math.min(repMax, Math.max(repMin, lowest + 1));
  return { weight, targetReps: target, kind: 'repeat', reason: `Same weight. Aim for ${target}+ reps on every set.` };
}

/**
 * Prefill for a set. Working sets come from the same position last session (adjusted by
 * the progression suggestion); warm-ups come from last session's warm-ups or ~50%.
 */
export function prefill(
  lastSession: Pick<SetLog, 'weight' | 'reps' | 'warmup'>[],
  doneThisSession: Pick<SetLog, 'weight' | 'reps' | 'warmup'>[],
  warmup: boolean,
  suggestion: Suggestion,
  increment: number,
): { weight: number; reps: number } {
  if (warmup) {
    const idx = doneThisSession.filter((s) => s.warmup).length;
    const lastWarm = lastSession.filter((s) => s.warmup);
    if (lastWarm[idx]) return { weight: lastWarm[idx].weight, reps: lastWarm[idx].reps };
    const step = increment > 0 ? increment : 1;
    return { weight: roundTo(suggestion.weight * 0.5, step), reps: 10 };
  }
  const doneWorking = doneThisSession.filter((s) => !s.warmup);
  // After the first working set, follow what you actually did today.
  const prev = doneWorking[doneWorking.length - 1];
  if (prev) return { weight: prev.weight, reps: prev.reps };
  if (suggestion.kind === 'increase') return { weight: suggestion.weight, reps: suggestion.targetReps };
  const lastWorking = lastSession.filter((s) => !s.warmup);
  const same = lastWorking[0];
  if (same) return { weight: same.weight, reps: same.reps };
  return { weight: suggestion.weight, reps: suggestion.targetReps };
}

/** Epley estimated 1RM. Only meaningful up to ~12 reps. */
export const e1rm = (weight: number, reps: number) =>
  reps <= 0 ? 0 : reps === 1 ? weight : weight * (1 + reps / 30);

export interface PrFlags { weight: boolean; e1rm: boolean; reps: boolean }

/**
 * Is `set` a PR compared with `history` (all earlier working sets for the exercise)?
 * - weight: heaviest load ever lifted
 * - e1rm: best estimated 1RM (reps ≤ 12)
 * - reps: most reps ever at this weight or heavier
 * No history means no PR (the first session is a baseline, not a record).
 */
export function prFlags(set: Pick<SetLog, 'weight' | 'reps' | 'warmup'>, history: Pick<SetLog, 'weight' | 'reps' | 'warmup'>[]): PrFlags {
  const none = { weight: false, e1rm: false, reps: false };
  const working = history.filter((s) => !s.warmup && s.reps > 0);
  if (set.warmup || set.reps <= 0 || working.length === 0) return none;
  const maxW = Math.max(...working.map((s) => s.weight));
  const best1 = Math.max(...working.filter((s) => s.reps <= 12).map((s) => e1rm(s.weight, s.reps)), 0);
  const heavierOrEqual = working.filter((s) => s.weight >= set.weight);
  const bestReps = heavierOrEqual.length ? Math.max(...heavierOrEqual.map((s) => s.reps)) : 0;
  return {
    weight: set.weight > maxW,
    e1rm: set.reps <= 12 && e1rm(set.weight, set.reps) > best1 + 0.01,
    reps: set.weight > 0 && heavierOrEqual.length > 0 && set.reps > bestReps,
  };
}

export const isPr = (f: PrFlags) => f.weight || f.e1rm || f.reps;
