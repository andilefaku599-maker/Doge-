import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { ExercisePicker } from '../components/ExercisePicker';
import { Button, Card, Empty, Header, field } from '../components/ui';
import { db } from '../lib/db';
import { uid } from '../lib/id';
import { navigate } from '../router';
import type { Routine, RoutineItem } from '../lib/types';
import { getActiveWorkout } from '../lib/workout';

export default function Train() {
  const routines = useLiveQuery(() => db.routines.orderBy('order').toArray(), []);
  const exMap = useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e.name])), []);
  const active = useLiveQuery(() => getActiveWorkout(), []);
  if (!routines || !exMap) return <div className="p-6 text-muted" role="status">Loading…</div>;

  const create = async () => {
    const r: Routine = { id: uid(), name: 'New routine', order: routines.length, items: [] };
    await db.routines.put(r);
    navigate(`/train/${r.id}`);
  };
  const move = async (i: number, d: number) => {
    const a = [...routines];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    await db.routines.bulkPut(a.map((r, k) => ({ ...r, order: k })));
  };

  return (
    <div className="pb-24">
      <Header title="Train" />
      <div className="space-y-3 px-4">
        {active && (
          <Card className="border border-accent/40">
            <p className="font-semibold">{active.name} is in progress.</p>
            <Button variant="primary" className="mt-2 w-full" onClick={() => navigate('/workout')}>Resume</Button>
          </Card>
        )}
        <p className="text-sm text-muted">Routines run in this order. Miss a day and the next one simply waits for you.</p>
        {!routines.length && <Empty title="No routines">Create one, or start a freestyle workout.</Empty>}
        {routines.map((r, i) => (
          <Card key={r.id}>
            <div className="flex items-start gap-2">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => navigate(`/train/${r.id}`)} aria-label={`Edit ${r.name}`}>
                <h2 className="text-lg font-bold">{r.name}</h2>
                <p className="line-clamp-2 text-sm text-muted">{r.items.map((it) => exMap.get(it.exerciseId) ?? '?').join(' · ') || 'No exercises'}</p>
              </button>
              <div className="flex flex-col">
                <button type="button" aria-label={`Move ${r.name} up`} disabled={i === 0} onClick={() => move(i, -1)} className="size-11 rounded-full active:bg-surface2">▲</button>
                <button type="button" aria-label={`Move ${r.name} down`} disabled={i === routines.length - 1} onClick={() => move(i, 1)} className="size-11 rounded-full active:bg-surface2">▼</button>
              </div>
            </div>
            {!active && <Button variant="primary" className="mt-2 w-full" onClick={() => navigate(`/workout?start=${r.id}`)}>Start {r.name}</Button>}
          </Card>
        ))}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={create}>+ New routine</Button>
          {!active && <Button onClick={() => navigate('/workout?start=freestyle')}>Freestyle</Button>}
        </div>
      </div>
    </div>
  );
}

const num = (label: string, value: number, onChange: (v: number) => void, min = 1, max = 50) => (
  <label className="flex flex-col items-center">
    <span className="text-[11px] text-muted">{label}</span>
    <span className="flex items-center">
      <button type="button" aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - 1))} className="size-11 rounded-xl bg-surface2 font-bold">−</button>
      <span className="w-8 text-center font-bold" aria-live="polite">{value}</span>
      <button type="button" aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(max, value + 1))} className="size-11 rounded-xl bg-surface2 font-bold">+</button>
    </span>
  </label>
);

export function RoutineEdit({ id }: { id: string }) {
  const routine = useLiveQuery(() => db.routines.get(id), [id]);
  const exMap = useLiveQuery(async () => new Map((await db.exercises.toArray()).map((e) => [e.id, e])), []);
  const [picking, setPicking] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  if (routine === undefined || !exMap) return <div className="p-6 text-muted" role="status">Loading…</div>;
  if (!routine) return <div className="p-6"><Empty title="Routine not found" /></div>;

  const save = (patch: Partial<Routine>) => db.routines.update(id, patch);
  const setItem = (i: number, patch: Partial<RoutineItem>) =>
    save({ items: routine.items.map((it, k) => (k === i ? { ...it, ...patch } : it)) });
  const moveItem = (i: number, d: number) => {
    const a = [...routine.items]; const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]]; save({ items: a });
  };

  return (
    <div className="pb-24">
      <Header title="Edit routine" onBack={() => navigate('/train')} />
      <div className="space-y-3 px-4">
        <label className="block">
          <span className="text-sm text-muted">Name</span>
          <input className={field} value={routine.name} onChange={(e) => save({ name: e.target.value })} />
        </label>
        {routine.items.map((it, i) => {
          const e = exMap.get(it.exerciseId);
          return (
            <Card key={i} className="space-y-2">
              <div className="flex items-center gap-1">
                <p className="flex-1 font-bold">{e?.name ?? 'Unknown'}</p>
                <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => moveItem(i, -1)} className="size-11 rounded-full">▲</button>
                <button type="button" aria-label="Move down" disabled={i === routine.items.length - 1} onClick={() => moveItem(i, 1)} className="size-11 rounded-full">▼</button>
                <button type="button" aria-label={`Remove ${e?.name}`} onClick={() => save({ items: routine.items.filter((_, k) => k !== i) })} className="size-11 rounded-full text-danger">✕</button>
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                {num('Sets', it.sets, (v) => setItem(i, { sets: v }), 1, 10)}
                {num('Min reps', it.repMin, (v) => setItem(i, { repMin: v, repMax: Math.max(v, it.repMax) }), 1, 50)}
                {num('Max reps', it.repMax, (v) => setItem(i, { repMax: v, repMin: Math.min(v, it.repMin) }), 1, 50)}
              </div>
              <label className="flex items-center justify-between gap-2 text-sm">
                <span className="text-muted">Rest (seconds), blank = exercise default ({e?.rest ?? 90}s)</span>
                <input type="number" inputMode="numeric" className="min-h-11 w-20 rounded-xl bg-surface2 text-center" value={it.rest ?? ''}
                  aria-label="Rest seconds" onChange={(ev) => setItem(i, { rest: ev.target.value ? Math.max(0, parseInt(ev.target.value)) : undefined })} />
              </label>
            </Card>
          );
        })}
        <Button className="w-full" onClick={() => setPicking(true)}>+ Add exercise</Button>
        {confirmDel ? (
          <Button variant="danger" className="w-full" onClick={async () => { await db.routines.delete(id); navigate('/train', true); }}>Tap again to delete routine</Button>
        ) : (
          <Button variant="ghost" className="w-full text-muted" onClick={() => setConfirmDel(true)}>Delete routine</Button>
        )}
        <p className="text-xs text-muted">Past workouts are kept when you edit or delete a routine.</p>
      </div>
      <ExercisePicker open={picking} onClose={() => setPicking(false)} onPick={(e) => {
        save({ items: [...routine.items, { exerciseId: e.id, sets: 3, repMin: 8, repMax: 12 }] }); setPicking(false);
      }} />
    </div>
  );
}
