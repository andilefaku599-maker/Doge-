export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'other';

export interface Exercise {
  id: string;
  name: string;
  muscle: string;
  equipment: Equipment;
  /** Smallest sensible load jump in kg for this exercise. */
  increment: number;
  /** Default rest in seconds. */
  rest: number;
  custom?: boolean;
}

export interface RoutineItem {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  /** Overrides the exercise's default rest, in seconds. */
  rest?: number;
}

export interface Routine {
  id: string;
  name: string;
  order: number;
  items: RoutineItem[];
}

export interface WorkoutItem extends RoutineItem {
  /** Set when this slot was swapped from another exercise. */
  swappedFrom?: string;
}

export interface Draft {
  weight: number;
  reps: number;
  warmup: boolean;
  rpe?: number;
}

export interface Workout {
  id: string;
  routineId?: string;
  name: string;
  startedAt: number;
  endedAt?: number;
  status: 'active' | 'done';
  items: WorkoutItem[];
  currentIndex: number;
  /** Rest timer is stored as timestamps so it survives backgrounding and restarts. */
  restEndsAt?: number;
  restDuration?: number;
  /** Unconfirmed values on screen, so a restart resumes exactly. */
  draft?: Draft & { exerciseId: string };
  notes?: string;
}

export interface SetLog {
  id: string;
  workoutId: string;
  exerciseId: string;
  weight: number;
  reps: number;
  warmup: boolean;
  rpe?: number;
  note?: string;
  /** PR kinds flagged when the set was logged. */
  pr?: string[];
  at: number;
}

export interface Profile {
  id: 'me';
  heightCm: number;
  weightKg: number;
  age: number;
  sex: 'male' | 'female';
  goal: 'recomp' | 'cut' | 'bulk' | 'maintain';
  kcalTarget: number;
  proteinTarget: number;
  alcoholCapPerDay: number;
}

/** Defined now so Today can read it; logging UI arrives in Phase 2. */
export interface FoodEntry {
  id: string;
  date: string; // YYYY-MM-DD local
  name: string;
  kcal: number;
  protein: number;
  carbs?: number;
  fat?: number;
  at: number;
}
