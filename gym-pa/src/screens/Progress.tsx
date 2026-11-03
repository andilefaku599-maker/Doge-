import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { LineChart } from '../components/LineChart';
import { Card, Chip, Empty, Header } from '../components/ui';
import { db } from '../lib/db';
import { kg } from '../lib/hooks';
import { e1rm } from '../lib/progression';
import { navigate } from '../router';
import type { Exercise, SetLog } from '../lib/types';
import { EditSetSheet } from './Workout';

export default function Progress({ tab }: { tab: string | null }) {
  const view = tab === 'history' ? 'history' : 'exercises';
  return (
    <div className="pb-24">
      <Header title="Progress" />
      <div className="flex gap-2 px-4 pb-3" role="tablist">
        <Chip role="tab" aria-selected={view === 'exercises'} active={view === 'exercises'} onClick={() => navigate('/progress', true)}>Exercises</Chip>
        <Chip role="tab" aria-selected={view === 'history'} active={view === 'history'} onClick={() => navigate('/progress?tab=history', true)}>History</Chip>
      </div>
      {view === 'exercises' ? <ExerciseList /> : <History />}
    </div>
  );
}

function ExerciseList() {
  const data = useLiveQuery(async () => {
    const [sets, exercises] = await Promise.all([db.sets.toArray(), db.exercises.toArray()]);
    const by = new Map<string, SetLog[]>();
    for (const s of sets) if (!s.warmup) (by.get(s.exerciseId) ?? by.set(s.exerciseId, []).get(s.exerciseId)!).push(s);
    return exercises
      .filter((e) => by.has(e.id))
      .map((e) => {
        const ss = by.get(e.id)!;
        return { e, last: Math.max(...ss.map((s) => s.at)), top: Math.max(...ss.map((s) => s.weight)), best: Math.max(...ss.filter((s) => s.reps <= 12).map((s) => e1rm(s.weight, s.reps)), 0) };
      })
      .sort((a, b) => b.last - a.last);
  }, []);
  if (!data) return <div className="p-6 text-muted" role="status">Loading…</div>;
  if (!data.length) return <div className="px-4"><Empty title="Nothing logged yet">Your exercise charts and records show up here after your first workout.</Empty></div>;
  return (
    <ul className="space-y-2 px-4">
      {data.map(({ e, top, best }) => (
        <li key={e.id}>
          <button type="button" onClick={() => navigate(`/progress/${e.id}`)} className="flex min-h-16 w-full items-center justify-between gap-3 rounded-2xl bg-surface px-4 text-left active:bg-surface2">
            <span className="min-w-0"><span className="block truncate font-semibold">{e.name}</span><span className="text-xs text-muted">{e.muscle}</span></span>
            <span className="shrink-0 text-right text-sm"><span className="block font-bold">{kg(top)} kg</span><span className="text-xs text-muted">e1RM {Math.round(best)}</span></span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export function ExerciseDetail({ id }: { id: string }) {
  const data = useLiveQuery(async () => {
    const e = await db.exercises.get(id);
    const sets = (await db.sets.where('exerciseId').equals(id).sortBy('at')).filter((s) => !s.warmup);
    const sessions = new Map<string, SetLog[]>();
    for (const s of sets) (sessions.get(s.workoutId) ?? sessions.set(s.workoutId, []).get(s.workoutId)!).push(s);
    return { e, sessions: [...sessions.values()] };
  }, [id]);
  const [editing, setEditing] = useState<SetLog | null>(null);
  if (!data) return <div className="p-6 text-muted" role="status">Loading…</div>;
  const { e, sessions } = data;
  if (!e) return <div className="p-6"><Empty title="Exercise not found" /></div>;

  const pts = sessions.map((ss) => ({
    x: ss[0].at,
    top: Math.max(...ss.map((s) => s.weight)),
    best: Math.max(...ss.map((s) => e1rm(s.weight, s.reps))),
  }));
  const all = sessions.flat();
  const top = all.length ? Math.max(...all.map((s) => s.weight)) : 0;
  const bestSet = all.reduce<SetLog | null>((b, s) => (s.reps <= 12 && (!b || e1rm(s.weight, s.reps) > e1rm(b.weight, b.reps)) ? s : b), null);

  return (
    <div className="pb-24">
      <Header title={e.name} onBack={() => navigate('/progress')} />
      <div className="space-y-3 px-4">
        <div className="grid grid-cols-2 gap-3">
          <Card><p className="text-xs text-muted">Heaviest</p><p className="text-2xl font-extrabold">{kg(top)} kg</p></Card>
          <Card><p className="text-xs text-muted">Best e1RM</p><p className="text-2xl font-extrabold">{bestSet ? Math.round(e1rm(bestSet.weight, bestSet.reps)) : '–'} kg</p>
            {bestSet && <p className="text-xs text-muted">{kg(bestSet.weight)} × {bestSet.reps}</p>}</Card>
        </div>
        <Card>
          <LineChart label={`${e.name}: estimated 1RM and top weight per session`} series={[
            { name: 'Est. 1RM', color: '#c8f135', points: pts.map((p) => ({ x: p.x, y: Math.round(p.best * 10) / 10 })) },
            { name: 'Top set', color: '#7cc4ff', dashed: true, points: pts.map((p) => ({ x: p.x, y: p.top })) },
          ]} />
        </Card>
        <ExerciseSettings e={e} />
        <h2 className="pt-2 font-bold">Sessions</h2>
        {!sessions.length && <Empty title="No sessions yet" />}
        <ul className="space-y-2">
          {[...sessions].reverse().map((ss) => (
            <li key={ss[0].workoutId} className="rounded-2xl bg-surface p-3">
              <p className="text-sm text-muted">{new Date(ss[0].at).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {ss.map((s) => (
                  <button key={s.id} type="button" onClick={() => setEditing(s)} aria-label={`Edit ${kg(s.weight)} by ${s.reps}`}
                    className={`min-h-11 rounded-xl px-3 text-sm font-semibold ${s.pr?.length ? 'bg-accent text-accent-ink' : 'bg-surface2'}`}>
                    {kg(s.weight)}×{s.reps}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
      <EditSetSheet set={editing} ex={e} onClose={() => setEditing(null)} />
    </div>
  );
}

function ExerciseSettings({ e }: { e: Exercise }) {
  return (
    <Card className="space-y-2">
      <h2 className="font-bold">Defaults for this exercise</h2>
      <label className="flex items-center justify-between gap-2 text-sm">
        <span>Weight step (kg)</span>
        <select className="min-h-11 rounded-xl bg-surface2 px-3" value={e.increment} aria-label="Weight step"
          onChange={(ev) => db.exercises.update(e.id, { increment: parseFloat(ev.target.value) })}>
          {[0, 1, 1.25, 2, 2.5, 5, 10].map((v) => <option key={v} value={v}>{v === 0 ? 'Reps only' : v}</option>)}
        </select>
      </label>
      <label className="flex items-center justify-between gap-2 text-sm">
        <span>Default rest</span>
        <select className="min-h-11 rounded-xl bg-surface2 px-3" value={e.rest} aria-label="Default rest"
          onChange={(ev) => db.exercises.update(e.id, { rest: parseInt(ev.target.value) })}>
          {[45, 60, 75, 90, 120, 150, 180, 240].map((v) => <option key={v} value={v}>{Math.floor(v / 60)}:{String(v % 60).padStart(2, '0')}</option>)}
        </select>
      </label>
    </Card>
  );
}

function History() {
  const data = useLiveQuery(async () => {
    const ws = await db.workouts.where('status').equals('done').reverse().sortBy('startedAt');
    const sets = await db.sets.toArray();
    const ex = new Map((await db.exercises.toArray()).map((e) => [e.id, e]));
    return { ws, sets, ex };
  }, []);
  const [open, setOpen] = useState<string | null>(null);
  const [editing, setEditing] = useState<SetLog | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  if (!data) return <div className="p-6 text-muted" role="status">Loading…</div>;
  if (!data.ws.length) return <div className="px-4"><Empty title="No finished workouts yet" /></div>;
  return (
    <ul className="space-y-2 px-4">
      {data.ws.map((w) => {
        const ss = data.sets.filter((s) => s.workoutId === w.id).sort((a, b) => a.at - b.at);
        const working = ss.filter((s) => !s.warmup);
        const byEx = new Map<string, SetLog[]>();
        for (const s of ss) (byEx.get(s.exerciseId) ?? byEx.set(s.exerciseId, []).get(s.exerciseId)!).push(s);
        const isOpen = open === w.id;
        return (
          <li key={w.id} className="rounded-2xl bg-surface">
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : w.id)} className="flex min-h-16 w-full items-center justify-between px-4 text-left">
              <span><span className="block font-semibold">{w.name}</span>
                <span className="text-xs text-muted">{new Date(w.startedAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {w.endedAt ? ` · ${Math.round((w.endedAt - w.startedAt) / 60000)} min` : ''}</span></span>
              <span className="text-sm text-muted">{working.length} sets{ss.some((s) => s.pr?.length) ? ' · PR' : ''}</span>
            </button>
            {isOpen && (
              <div className="space-y-2 px-4 pb-4">
                {[...byEx].map(([exId, list]) => (
                  <div key={exId}>
                    <p className="text-sm font-semibold">{data.ex.get(exId)?.name ?? 'Unknown'}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {list.map((s) => (
                        <button key={s.id} type="button" onClick={() => setEditing(s)} className={`min-h-11 rounded-xl px-3 text-sm ${s.warmup ? 'bg-surface2 text-muted' : 'bg-surface2 font-semibold'}`}>
                          {s.warmup ? 'W ' : ''}{kg(s.weight)}×{s.reps}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {w.notes && <p className="text-sm text-muted">“{w.notes}”</p>}
                {confirmDel === w.id ? (
                  <button type="button" className="min-h-11 text-sm font-semibold text-danger" onClick={async () => {
                    await db.transaction('rw', db.sets, db.workouts, async () => { await db.sets.where('workoutId').equals(w.id).delete(); await db.workouts.delete(w.id); });
                  }}>Tap again to delete this workout</button>
                ) : (
                  <button type="button" className="min-h-11 text-sm text-muted" onClick={() => setConfirmDel(w.id)}>Delete workout</button>
                )}
              </div>
            )}
          </li>
        );
      })}
      <EditSetSheet set={editing} ex={editing ? data.ex.get(editing.exerciseId) : undefined} onClose={() => setEditing(null)} />
    </ul>
  );
}
