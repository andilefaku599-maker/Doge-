import { db } from './db';
import { uid } from './id';
import { prFlags, type PrFlags } from './progression';
import { startRest } from './timer';
import type { Routine, SetLog, Workout, WorkoutItem } from './types';

export async function getActiveWorkout() {
  return db.workouts.where('status').equals('active').first();
}

/** Next routine in rotation (after the last completed one). Weekday-independent by design. */
export async function nextRoutine(): Promise<Routine | undefined> {
  const routines = await db.routines.orderBy('order').toArray();
  if (!routines.length) return undefined;
  const last = (await db.workouts.where('status').equals('done').reverse().sortBy('startedAt'))
    .find((w) => w.routineId && routines.some((r) => r.id === w.routineId));
  if (!last) return routines[0];
  const i = routines.findIndex((r) => r.id === last.routineId);
  return routines[(i + 1) % routines.length];
}

export async function startWorkout(routine?: Routine): Promise<Workout> {
  const active = await getActiveWorkout();
  if (active) return active;
  const w: Workout = {
    id: uid(),
    routineId: routine?.id,
    name: routine?.name ?? 'Freestyle workout',
    startedAt: Date.now(),
    status: 'active',
    items: routine ? routine.items.map((i) => ({ ...i })) : [],
    currentIndex: 0,
  };
  await db.workouts.put(w);
  return w;
}

export async function setsFor(workoutId: string) {
  return db.sets.where('workoutId').equals(workoutId).sortBy('at');
}

/** All sets for an exercise before `before`, oldest first. */
export async function exerciseHistory(exerciseId: string, before = Infinity): Promise<SetLog[]> {
  return db.sets
    .where('[exerciseId+at]')
    .between([exerciseId, 0], [exerciseId, before], true, false)
    .toArray();
}

/** The most recent other session's sets for this exercise. */
export async function lastSession(exerciseId: string, excludeWorkoutId?: string): Promise<SetLog[]> {
  const all = (await exerciseHistory(exerciseId)).filter((s) => s.workoutId !== excludeWorkoutId);
  if (!all.length) return [];
  const lastId = all[all.length - 1].workoutId;
  return all.filter((s) => s.workoutId === lastId);
}

export async function patchWorkout(id: string, patch: Partial<Workout>) {
  await db.workouts.update(id, patch);
}

export interface LogResult { set: SetLog; pr: PrFlags; advanced: boolean }

/** Saves the set immediately, starts rest, and advances when planned working sets are done. */
export async function logSet(w: Workout, data: Omit<SetLog, 'id' | 'workoutId' | 'at' | 'exerciseId'>): Promise<LogResult> {
  const item = w.items[w.currentIndex];
  const now = Date.now();
  const history = await exerciseHistory(item.exerciseId, now);
  const set: SetLog = { id: uid(), workoutId: w.id, exerciseId: item.exerciseId, at: now, ...data };
  const pr = prFlags(set, history);
  const kinds = (Object.keys(pr) as (keyof PrFlags)[]).filter((k) => pr[k]);
  if (kinds.length) set.pr = kinds;
  const ex = await db.exercises.get(item.exerciseId);
  const restSec = item.rest ?? ex?.rest ?? 90;

  let advanced = false;
  await db.transaction('rw', db.sets, db.workouts, async () => {
    await db.sets.put(set);
    const done = (await db.sets.where('workoutId').equals(w.id).toArray())
      .filter((s) => s.exerciseId === item.exerciseId && !s.warmup).length;
    const patch: Partial<Workout> = { draft: undefined };
    const r = startRest(now, restSec);
    patch.restEndsAt = r.endsAt;
    patch.restDuration = r.duration;
    if (!set.warmup && done >= item.sets && w.currentIndex < w.items.length - 1) {
      patch.currentIndex = w.currentIndex + 1;
      advanced = true;
    }
    await db.workouts.update(w.id, patch);
  });
  return { set, pr, advanced };
}

export async function updateSet(id: string, patch: Partial<SetLog>) {
  await db.sets.update(id, patch);
}
export async function deleteSet(id: string) {
  await db.sets.delete(id);
}

export async function swapExercise(w: Workout, index: number, exerciseId: string) {
  const items = w.items.map((it, i): WorkoutItem =>
    i === index ? { ...it, exerciseId, rest: undefined, swappedFrom: it.swappedFrom ?? it.exerciseId } : it);
  await db.workouts.update(w.id, { items, draft: undefined });
}

export async function addExercise(w: Workout, exerciseId: string) {
  const items = [...w.items, { exerciseId, sets: 3, repMin: 8, repMax: 12 }];
  await db.workouts.update(w.id, { items, currentIndex: items.length - 1, draft: undefined });
}

export async function finishWorkout(w: Workout) {
  await db.workouts.update(w.id, { status: 'done', endedAt: Date.now(), restEndsAt: undefined, draft: undefined });
}

export async function discardWorkout(w: Workout) {
  await db.transaction('rw', db.sets, db.workouts, async () => {
    await db.sets.where('workoutId').equals(w.id).delete();
    await db.workouts.delete(w.id);
  });
}
