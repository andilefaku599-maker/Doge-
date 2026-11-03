import type { Exercise, Equipment, Routine } from './types';

/** Smallest sensible jump by equipment at a typical South African commercial gym. */
export const DEFAULT_INCREMENT: Record<Equipment, number> = {
  barbell: 2.5,   // 1.25 kg plates each side
  dumbbell: 2,    // most racks step in 2 kg (some 2.5 kg); editable per exercise
  machine: 5,     // pin-loaded stacks
  cable: 2.5,     // half-plates / add-on weights on most stacks
  bodyweight: 0,  // progress reps, then add load
  other: 2.5,
};

const ex = (id: string, name: string, muscle: string, equipment: Equipment, rest: number, increment?: number): Exercise =>
  ({ id, name, muscle, equipment, rest, increment: increment ?? DEFAULT_INCREMENT[equipment] });

export const LIBRARY: Exercise[] = [
  // Chest
  ex('bench', 'Barbell bench press', 'Chest', 'barbell', 150),
  ex('incline-bench', 'Incline barbell bench press', 'Chest', 'barbell', 150),
  ex('db-bench', 'Dumbbell bench press', 'Chest', 'dumbbell', 120),
  ex('incline-db', 'Incline dumbbell press', 'Chest', 'dumbbell', 120),
  ex('chest-press', 'Machine chest press', 'Chest', 'machine', 90),
  ex('pec-deck', 'Pec deck / machine fly', 'Chest', 'machine', 75),
  ex('cable-fly', 'Cable fly', 'Chest', 'cable', 75),
  ex('pushup', 'Push-up', 'Chest', 'bodyweight', 75),
  ex('dips', 'Dips (assisted ok)', 'Chest', 'bodyweight', 90),
  // Back
  ex('deadlift', 'Deadlift', 'Back', 'barbell', 180, 5),
  ex('bb-row', 'Barbell row', 'Back', 'barbell', 120),
  ex('db-row', 'One-arm dumbbell row', 'Back', 'dumbbell', 90),
  ex('cable-row', 'Seated cable row', 'Back', 'cable', 90),
  ex('machine-row', 'Chest-supported machine row', 'Back', 'machine', 90),
  ex('pulldown', 'Lat pulldown', 'Back', 'cable', 90),
  ex('pullup', 'Pull-up / assisted pull-up', 'Back', 'bodyweight', 120),
  ex('straight-arm', 'Straight-arm pulldown', 'Back', 'cable', 75),
  // Shoulders
  ex('ohp', 'Overhead press', 'Shoulders', 'barbell', 150),
  ex('db-ohp', 'Seated dumbbell shoulder press', 'Shoulders', 'dumbbell', 120),
  ex('machine-ohp', 'Machine shoulder press', 'Shoulders', 'machine', 90),
  ex('lateral', 'Dumbbell lateral raise', 'Shoulders', 'dumbbell', 60),
  ex('cable-lateral', 'Cable lateral raise', 'Shoulders', 'cable', 60),
  ex('face-pull', 'Face pull', 'Shoulders', 'cable', 60),
  ex('rear-delt', 'Reverse pec deck', 'Shoulders', 'machine', 60),
  // Arms
  ex('db-curl', 'Dumbbell curl', 'Biceps', 'dumbbell', 60),
  ex('hammer', 'Hammer curl', 'Biceps', 'dumbbell', 60),
  ex('ez-curl', 'EZ-bar curl', 'Biceps', 'barbell', 75),
  ex('cable-curl', 'Cable curl', 'Biceps', 'cable', 60),
  ex('pushdown', 'Cable triceps pushdown', 'Triceps', 'cable', 60),
  ex('oh-ext', 'Overhead cable triceps extension', 'Triceps', 'cable', 60),
  ex('skull', 'EZ-bar skull crusher', 'Triceps', 'barbell', 75),
  // Legs
  ex('squat', 'Back squat', 'Quads', 'barbell', 180),
  ex('hack', 'Hack squat', 'Quads', 'machine', 150, 10),
  ex('leg-press', 'Leg press', 'Quads', 'machine', 150, 10),
  ex('goblet', 'Goblet squat', 'Quads', 'dumbbell', 90),
  ex('split-squat', 'Bulgarian split squat', 'Quads', 'dumbbell', 90),
  ex('lunge', 'Walking lunge', 'Quads', 'dumbbell', 90),
  ex('leg-ext', 'Leg extension', 'Quads', 'machine', 75),
  ex('rdl', 'Romanian deadlift', 'Hamstrings', 'barbell', 150),
  ex('db-rdl', 'Dumbbell Romanian deadlift', 'Hamstrings', 'dumbbell', 120),
  ex('leg-curl', 'Seated / lying leg curl', 'Hamstrings', 'machine', 75),
  ex('hip-thrust', 'Hip thrust', 'Glutes', 'barbell', 120),
  ex('abductor', 'Hip abductor machine', 'Glutes', 'machine', 60),
  ex('calf', 'Standing calf raise', 'Calves', 'machine', 60),
  ex('seated-calf', 'Seated calf raise', 'Calves', 'machine', 60),
  // Core
  ex('cable-crunch', 'Cable crunch', 'Core', 'cable', 60),
  ex('hanging-raise', 'Hanging knee raise', 'Core', 'bodyweight', 60),
  ex('plank', 'Plank (log seconds as reps)', 'Core', 'bodyweight', 60),
];

const it = (exerciseId: string, sets: number, repMin: number, repMax: number) => ({ exerciseId, sets, repMin, repMax });

/**
 * Default 4-day Upper/Lower. Routines rotate in order, not by weekday,
 * so a missed day just means the next session waits for you.
 */
export const DEFAULT_ROUTINES: Routine[] = [
  { id: 'upper-a', name: 'Upper A', order: 0, items: [
    it('bench', 3, 6, 10), it('cable-row', 3, 8, 12), it('db-ohp', 3, 8, 12),
    it('pulldown', 3, 8, 12), it('pushdown', 2, 10, 15), it('db-curl', 2, 10, 15),
  ] },
  { id: 'lower-a', name: 'Lower A', order: 1, items: [
    it('leg-press', 3, 8, 12), it('rdl', 3, 8, 12), it('leg-curl', 3, 10, 15),
    it('leg-ext', 2, 10, 15), it('calf', 3, 10, 15), it('cable-crunch', 2, 10, 15),
  ] },
  { id: 'upper-b', name: 'Upper B', order: 2, items: [
    it('incline-db', 3, 8, 12), it('machine-row', 3, 8, 12), it('machine-ohp', 3, 8, 12),
    it('pulldown', 3, 10, 12), it('lateral', 3, 12, 15), it('face-pull', 2, 12, 15),
    it('hammer', 2, 10, 15), it('oh-ext', 2, 10, 15),
  ] },
  { id: 'lower-b', name: 'Lower B', order: 3, items: [
    it('hack', 3, 6, 10), it('hip-thrust', 3, 8, 12), it('leg-curl', 3, 10, 15),
    it('split-squat', 2, 8, 12), it('seated-calf', 3, 12, 15), it('hanging-raise', 2, 8, 15),
  ] },
];
