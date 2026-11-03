/**
 * Rest timer maths. All state is absolute timestamps, never a countdown counter, so the
 * value is correct after backgrounding, screen-off or an app restart.
 */
export interface RestState { endsAt: number; duration: number }

export const startRest = (now: number, seconds: number): RestState => ({
  endsAt: now + seconds * 1000,
  duration: seconds,
});

/** Remaining whole seconds (rounded up so "0" only shows when finished). */
export const remaining = (s: RestState | undefined, now: number) =>
  s ? Math.max(0, Math.ceil((s.endsAt - now) / 1000)) : 0;

export const isDone = (s: RestState | undefined, now: number) => !s || now >= s.endsAt;

/** Adjust by ±seconds. Never goes below "now" and the duration tracks the change for the progress bar. */
export const adjust = (s: RestState, deltaSec: number, now: number): RestState => {
  const endsAt = Math.max(now, s.endsAt + deltaSec * 1000);
  return { endsAt, duration: Math.max(1, s.duration + deltaSec) };
};

/** Fraction elapsed, 0..1. */
export const progress = (s: RestState | undefined, now: number) => {
  if (!s) return 1;
  const total = s.duration * 1000;
  return Math.min(1, Math.max(0, 1 - (s.endsAt - now) / total));
};

export const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
