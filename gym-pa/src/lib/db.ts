import Dexie, { type EntityTable } from 'dexie';
import type { Exercise, FoodEntry, Profile, Routine, SetLog, Workout } from './types';
import { DEFAULT_ROUTINES, LIBRARY } from './library';
import { suggestTargets } from './targets';

export class SpotterDB extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  routines!: EntityTable<Routine, 'id'>;
  workouts!: EntityTable<Workout, 'id'>;
  sets!: EntityTable<SetLog, 'id'>;
  profile!: EntityTable<Profile, 'id'>;
  food!: EntityTable<FoodEntry, 'id'>;
  meta!: EntityTable<{ key: string; value: unknown }, 'key'>;

  constructor(name = 'spotter') {
    super(name);
    this.version(1).stores({
      exercises: 'id, name, muscle',
      routines: 'id, order',
      workouts: 'id, status, startedAt, routineId',
      sets: 'id, workoutId, exerciseId, at, [exerciseId+at]',
      profile: 'id',
      food: 'id, date, at',
      meta: 'key',
    });
  }
}

export const db = new SpotterDB();

/** Starting profile from your answers. Age is assumed; edit it in Settings. */
export const DEFAULT_PROFILE = (() => {
  const base = { heightCm: 160, weightKg: 119, age: 35, sex: 'male' as const, goal: 'recomp' as const };
  const t = suggestTargets(base);
  return { id: 'me' as const, ...base, kcalTarget: t.kcal, proteinTarget: t.protein, alcoholCapPerDay: 3 };
})();

export async function seed(d: SpotterDB = db) {
  await d.transaction('rw', d.exercises, d.routines, d.profile, d.meta, async () => {
    const seeded = await d.meta.get('seeded');
    if (seeded) return;
    await d.exercises.bulkPut(LIBRARY);
    await d.routines.bulkPut(DEFAULT_ROUTINES);
    if (!(await d.profile.get('me'))) await d.profile.put(DEFAULT_PROFILE);
    await d.meta.put({ key: 'seeded', value: Date.now() });
  });
}

/** Ask the browser not to evict our data under storage pressure. */
export async function requestPersistence(): Promise<boolean | undefined> {
  try {
    if (!navigator.storage?.persist) return undefined;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return undefined;
  }
}
