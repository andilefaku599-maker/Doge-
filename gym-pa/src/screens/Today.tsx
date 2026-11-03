import { useLiveQuery } from 'dexie-react-hooks';
import { Button, Card } from '../components/ui';
import { db } from '../lib/db';
import { localDate } from '../lib/id';
import { navigate } from '../router';
import { getActiveWorkout, nextRoutine } from '../lib/workout';

const ago = (t: number) => {
  const days = Math.floor((new Date(localDate()).getTime() - new Date(localDate(t)).getTime()) / 86400000);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
};

export default function Today() {
  const data = useLiveQuery(async () => {
    const [active, next, profile, exercises, lastDone] = await Promise.all([
      getActiveWorkout(), nextRoutine(), db.profile.get('me'), db.exercises.toArray(),
      db.workouts.where('status').equals('done').reverse().sortBy('startedAt').then((a) => a[0]),
    ]);
    const food = await db.food.where('date').equals(localDate()).toArray();
    const activeSets = active ? await db.sets.where('workoutId').equals(active.id).count() : 0;
    return { active, next, profile, exMap: new Map(exercises.map((e) => [e.id, e.name])), lastDone, food, activeSets };
  }, []);
  if (!data) return <div className="p-6 text-muted" role="status">Loading…</div>;
  const { active, next, profile, exMap, lastDone, food, activeSets } = data;
  const kcal = food.reduce((a, f) => a + f.kcal, 0);
  const protein = food.reduce((a, f) => a + f.protein, 0);
  const kcalLeft = (profile?.kcalTarget ?? 0) - kcal;
  const proteinLeft = (profile?.proteinTarget ?? 0) - protein;
  const date = new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });

  const primary = active
    ? { label: `Resume ${active.name}`, go: () => navigate('/workout') }
    : next
      ? { label: `Start ${next.name}`, go: () => navigate(`/workout?start=${next.id}`) }
      : { label: 'Create a routine', go: () => navigate('/train') };

  return (
    <div className="space-y-3 px-4 pt-[max(env(safe-area-inset-top),16px)] pb-40">
      <header>
        <p className="text-sm text-muted">{date}</p>
        <h1 className="text-3xl font-extrabold">Today</h1>
      </header>

      <Card>
        {active ? (
          <>
            <p className="text-xs uppercase tracking-wide text-accent">In progress</p>
            <h2 className="text-xl font-bold">{active.name}</h2>
            <p className="text-sm text-muted">{activeSets} sets logged · started {new Date(active.startedAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
          </>
        ) : next ? (
          <>
            <p className="text-xs uppercase tracking-wide text-muted">Next up</p>
            <h2 className="text-xl font-bold">{next.name}</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {next.items.map((it, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span className="truncate">{exMap.get(it.exerciseId) ?? 'Unknown'}</span>
                  <span className="shrink-0 text-muted">{it.sets} × {it.repMin}–{it.repMax}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => navigate('/train')} className="mt-2 min-h-11 text-sm font-semibold text-accent">Do a different routine</button>
          </>
        ) : <p className="text-muted">No routines yet.</p>}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Calories left</p>
          <p className="text-3xl font-extrabold">{Math.round(kcalLeft)}</p>
          <p className="text-xs text-muted">of {profile?.kcalTarget} kcal</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-muted">Protein left</p>
          <p className="text-3xl font-extrabold">{Math.round(proteinLeft)}<span className="text-base font-semibold">g</span></p>
          <p className="text-xs text-muted">of {profile?.proteinTarget} g</p>
        </Card>
      </div>
      <p className="px-1 text-xs text-muted">Food logging arrives in Phase 2. Targets are editable in Settings.</p>

      {lastDone && <p className="px-1 text-sm text-muted">Last workout: {lastDone.name}, {ago(lastDone.startedAt)}.</p>}

      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-10 px-4 pb-3">
        <Button variant="primary" className="h-16 w-full text-xl shadow-lg shadow-black/50" onClick={primary.go}>{primary.label}</Button>
      </div>
    </div>
  );
}
