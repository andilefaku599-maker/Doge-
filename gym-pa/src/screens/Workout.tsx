import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ExercisePicker } from '../components/ExercisePicker';
import { Button, Chip, Header, Sheet, Stepper, field } from '../components/ui';
import { db } from '../lib/db';
import { kg, useNow, useWakeLock, vibrate } from '../lib/hooks';
import { prefill, suggestNext } from '../lib/progression';
import { navigate } from '../router';
import { adjust, fmt, isDone, progress, remaining } from '../lib/timer';
import type { Draft, Exercise, SetLog, Workout as W } from '../lib/types';
import {
  addExercise, deleteSet, discardWorkout, finishWorkout, getActiveWorkout, lastSession, logSet,
  nextRoutine, patchWorkout, startWorkout, swapExercise, updateSet,
} from '../lib/workout';

const PR_LABEL: Record<string, string> = { weight: 'heaviest weight', e1rm: 'best estimated 1RM', reps: 'most reps at this weight' };

export default function Workout({ start }: { start?: string | null }) {
  // Handle "Start workout" shortcut: resume if active, else start the next routine.
  const [booting, setBooting] = useState(!!start);
  useEffect(() => {
    if (!start) return;
    (async () => {
      if (!(await getActiveWorkout())) {
        const r = start === 'next' ? await nextRoutine() : await db.routines.get(start);
        await startWorkout(r);
      }
      navigate('/workout', true);
      setBooting(false);
    })();
  }, [start]);

  const w = useLiveQuery(() => getActiveWorkout(), []);
  if (booting || w === undefined) return <div className="p-6 text-muted" role="status">Loading…</div>;
  if (!w) {
    return (
      <div>
        <Header title="Workout" onBack={() => navigate('/')} />
        <div className="space-y-3 p-4">
          <p className="text-muted">No workout in progress.</p>
          <Button variant="primary" className="w-full" onClick={() => navigate('/workout?start=next')}>Start next workout</Button>
          <Button className="w-full" onClick={() => navigate('/train')}>Choose a routine</Button>
        </div>
      </div>
    );
  }
  return <Active w={w} />;
}

function Active({ w }: { w: W }) {
  useWakeLock(true);
  const exercises = useLiveQuery(() => db.exercises.toArray(), []);
  const sets = useLiveQuery(() => db.sets.where('workoutId').equals(w.id).sortBy('at'), [w.id]);
  const exMap = useMemo(() => new Map((exercises ?? []).map((e) => [e.id, e])), [exercises]);

  const [menu, setMenu] = useState(false);
  const [picker, setPicker] = useState<'swap' | 'add' | null>(null);
  const [editing, setEditing] = useState<SetLog | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const item = w.items[w.currentIndex];
  const ex = item ? exMap.get(item.exerciseId) : undefined;
  // Tag the result with its exercise so we never prefill from the previous exercise's history mid-transition.
  const lastQ = useLiveQuery(async () => ({ id: item?.exerciseId, sets: item ? await lastSession(item.exerciseId, w.id) : [] }), [item?.exerciseId, w.id]);
  const last = lastQ && lastQ.id === item?.exerciseId ? lastQ.sets : undefined;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (!exercises || !sets || last === undefined) return <div className="p-6 text-muted" role="status">Loading…</div>;

  const header = (
    <Header title={w.name} onBack={() => navigate('/')}
      right={<button type="button" onClick={() => setMenu(true)} className="min-h-12 rounded-full px-4 font-semibold text-accent active:bg-surface2">Exercises</button>} />
  );

  if (!item || !ex) {
    return (
      <div>
        {header}
        <div className="space-y-3 p-4">
          <p className="text-muted">No exercises yet.</p>
          <Button variant="primary" className="w-full" onClick={() => setPicker('add')}>Add exercise</Button>
          <Button className="w-full" onClick={() => setFinishing(true)}>Finish workout</Button>
        </div>
        <ExercisePicker open={picker === 'add'} onClose={() => setPicker(null)} onPick={(e) => { addExercise(w, e.id); setPicker(null); }} />
        <FinishSheet open={finishing} onClose={() => setFinishing(false)} w={w} sets={sets} />
      </div>
    );
  }

  const done = sets.filter((s) => s.exerciseId === item.exerciseId);
  const doneWorking = done.filter((s) => !s.warmup).length;

  return (
    <div className="flex min-h-full flex-col">
      {header}
      <div className="flex-1 space-y-3 px-4 pb-64">
        <ExerciseHead w={w} ex={ex} item={item} last={last} doneWorking={doneWorking} sets={sets} />
        <SetList sets={done} onEdit={setEditing} />
      </div>

      <SetPanel key={`${w.id}:${w.currentIndex}:${item.exerciseId}:${done.length}`} w={w} ex={ex} last={last} done={done}
        onLogged={(prs) => prs.length && setToast(`New PR: ${prs.map((p) => PR_LABEL[p]).join(', ')}`)} />

      {toast && (
        <div role="status" className="fixed inset-x-4 top-16 z-40 rounded-2xl bg-accent p-4 text-center font-bold text-accent-ink shadow-lg">{toast}</div>
      )}

      <Sheet open={menu} onClose={() => setMenu(false)} title="Exercises">
        <ol className="space-y-1">
          {w.items.map((it, i) => {
            const n = sets.filter((s) => s.exerciseId === it.exerciseId && !s.warmup).length;
            const e = exMap.get(it.exerciseId);
            return (
              <li key={i}>
                <button type="button" onClick={() => { patchWorkout(w.id, { currentIndex: i, draft: undefined }); setMenu(false); }}
                  className={`flex min-h-14 w-full items-center justify-between rounded-2xl px-3 text-left ${i === w.currentIndex ? 'bg-surface2' : 'active:bg-surface2'}`}>
                  <span><span className="font-semibold">{e?.name ?? 'Unknown'}</span>{it.swappedFrom && <span className="ml-2 text-xs text-muted">swapped</span>}</span>
                  <span className={`text-sm ${n >= it.sets ? 'text-accent' : 'text-muted'}`}>{n}/{it.sets}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button onClick={() => { setMenu(false); setPicker('swap'); }}>Swap current</Button>
          <Button onClick={() => { setMenu(false); setPicker('add'); }}>Add exercise</Button>
          <Button variant="primary" className="col-span-2" onClick={() => { setMenu(false); setFinishing(true); }}>Finish workout</Button>
        </div>
      </Sheet>

      <ExercisePicker open={picker === 'swap'} title={`Swap ${ex.name}`} preferMuscle={ex.muscle} onClose={() => setPicker(null)}
        onPick={(e) => { swapExercise(w, w.currentIndex, e.id); setPicker(null); }} />
      <ExercisePicker open={picker === 'add'} onClose={() => setPicker(null)} onPick={(e) => { addExercise(w, e.id); setPicker(null); }} />
      <EditSetSheet set={editing} ex={editing ? exMap.get(editing.exerciseId) : undefined} onClose={() => setEditing(null)} />
      <FinishSheet open={finishing} onClose={() => setFinishing(false)} w={w} sets={sets} />
    </div>
  );
}

function ExerciseHead({ w, ex, item, last, doneWorking, sets }: {
  w: W; ex: Exercise; item: W['items'][number]; last: SetLog[]; doneWorking: number; sets: SetLog[];
}) {
  const lastWorking = last.filter((s) => !s.warmup);
  const sug = suggestNext(lastWorking, item.sets, item.repMin, item.repMax, ex.increment);
  const go = (d: number) => patchWorkout(w.id, { currentIndex: w.currentIndex + d, draft: undefined });
  const lastDate = last[0] ? new Date(last[0].at).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' }) : null;
  const total = w.items.length;
  const workingDone = sets.filter((s) => !s.warmup).length;
  return (
    <section aria-label="Current exercise" className="pt-1">
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Previous exercise" disabled={w.currentIndex === 0} onClick={() => go(-1)}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-xl">‹</button>
        <div className="min-w-0 flex-1 text-center">
          <p className="text-xs text-muted">Exercise {w.currentIndex + 1} of {total} · {workingDone} sets today</p>
          <h2 className="truncate text-2xl font-extrabold">{ex.name}</h2>
          <p className="text-sm text-muted">
            Set {Math.min(doneWorking + 1, item.sets)}{doneWorking >= item.sets ? '+' : ''} of {item.sets} · {item.repMin}–{item.repMax} reps
          </p>
        </div>
        <button type="button" aria-label="Next exercise" disabled={w.currentIndex >= total - 1} onClick={() => go(1)}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-xl">›</button>
      </div>
      <div className="mt-3 rounded-2xl bg-surface p-3 text-sm">
        {lastWorking.length ? (
          <p><span className="text-muted">Last ({lastDate}): </span>
            <span className="font-semibold">{lastWorking.map((s) => `${kg(s.weight)}×${s.reps}`).join(', ')}</span></p>
        ) : <p className="text-muted">No history yet. Today sets your baseline.</p>}
        {sug.kind === 'increase' && <p className="mt-1 font-semibold text-accent">↑ {sug.reason}</p>}
        {sug.kind === 'repeat' && <p className="mt-1 text-muted">{sug.reason}</p>}
      </div>
    </section>
  );
}

function SetList({ sets, onEdit }: { sets: SetLog[]; onEdit: (s: SetLog) => void }) {
  if (!sets.length) return null;
  let n = 0;
  return (
    <ol aria-label="Logged sets" className="space-y-1">
      {sets.map((s) => {
        const label = s.warmup ? 'W' : String(++n);
        return (
          <li key={s.id}>
            <button type="button" onClick={() => onEdit(s)} aria-label={`Edit set ${label}: ${kg(s.weight)} kilograms for ${s.reps} reps`}
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl bg-surface px-3 text-left active:bg-surface2">
              <span className={`grid size-8 place-items-center rounded-full text-sm font-bold ${s.warmup ? 'bg-surface2 text-muted' : 'bg-accent/15 text-accent'}`}>{label}</span>
              <span className="flex-1 font-semibold">{kg(s.weight)} kg × {s.reps}{s.rpe ? <span className="ml-2 text-sm font-normal text-muted">RPE {s.rpe}</span> : null}</span>
              {s.pr?.length ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink">PR</span> : null}
              {s.note && <span className="text-xs text-muted" aria-label="Has note">✎</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Bottom-anchored thumb zone: rest timer, steppers, one big confirm button. */
function SetPanel({ w, ex, last, done, onLogged }: { w: W; ex: Exercise; last: SetLog[]; done: SetLog[]; onLogged: (pr: string[]) => void }) {
  const item = w.items[w.currentIndex];
  const step = ex.increment > 0 ? ex.increment : 1;
  const initial = (): Draft => {
    if (w.draft && w.draft.exerciseId === ex.id) return w.draft;
    const lastWasWarm = done.length > 0 && done[done.length - 1].warmup;
    const moreWarmups = last.filter((s) => s.warmup).length > done.filter((s) => s.warmup).length;
    const warmup = lastWasWarm && moreWarmups;
    const sug = suggestNext(last.filter((s) => !s.warmup), item.sets, item.repMin, item.repMax, ex.increment);
    return { ...prefill(last, done, warmup, sug, ex.increment), warmup };
  };
  const [d, setD] = useState<Draft>(initial);
  const dRef = useRef(d);
  const [busy, setBusy] = useState(false);
  const update = (patch: Partial<Draft>) => {
    const cur = dRef.current;
    let next = { ...cur, ...patch };
    if (patch.warmup !== undefined && patch.warmup !== cur.warmup) {
      // Toggling warm-up re-prefills from the right history.
      const sug = suggestNext(last.filter((s) => !s.warmup), item.sets, item.repMin, item.repMax, ex.increment);
      next = { ...next, ...prefill(last, done, patch.warmup, sug, ex.increment) };
    }
    dRef.current = next;
    setD(next);
    patchWorkout(w.id, { draft: { ...next, exerciseId: ex.id } });
  };
  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    vibrate(30);
    const cur = dRef.current;
    const r = await logSet(w, { weight: cur.weight, reps: cur.reps, warmup: cur.warmup, rpe: cur.rpe });
    onLogged(r.set.pr ?? []);
  };

  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/97 px-4 pt-3 backdrop-blur">
      <RestBar w={w} />
      <div className="mb-2 flex items-center gap-2">
        <Chip active={d.warmup} onClick={() => update({ warmup: !d.warmup })} aria-label="Warm-up set">Warm-up</Chip>
        <span className="ml-auto text-xs text-muted" id="rpe-label">RPE</span>
        <div className="flex gap-1" role="group" aria-labelledby="rpe-label">
          {[7, 8, 9, 10].map((r) => (
            <Chip key={r} active={d.rpe === r} onClick={() => update({ rpe: d.rpe === r ? undefined : r })} aria-label={`RPE ${r}`}>{r}</Chip>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Stepper label="Weight" unit="kg" value={d.weight} step={step} onChange={(v) => update({ weight: v })} />
        <Stepper label="Reps" value={d.reps} step={1} onChange={(v) => update({ reps: Math.round(v) })} />
      </div>
      <Button variant="primary" className="mt-3 mb-3 h-16 w-full text-xl" onClick={confirm} disabled={busy || d.reps <= 0}>
        ✓ Log {d.warmup ? 'warm-up' : 'set'} · {kg(d.weight)} × {d.reps}
      </Button>
    </div>
  );
}

function RestBar({ w }: { w: W }) {
  const state = w.restEndsAt && w.restDuration ? { endsAt: w.restEndsAt, duration: w.restDuration } : undefined;
  const now = useNow(!!state);
  const buzzed = useRef<number | null>(null);
  const finished = isDone(state, now);
  useEffect(() => {
    if (!state || !finished || buzzed.current === state.endsAt) return;
    buzzed.current = state.endsAt;
    // Only buzz if we noticed within a few seconds (not on reopening the app much later).
    if (now - state.endsAt < 5000) vibrate([200, 100, 200]);
  }, [finished, state, now]);
  if (!state) return null;
  const rem = remaining(state, now);
  return (
    <div className="mb-3 rounded-2xl bg-surface p-2" role="timer" aria-live="off" aria-label={finished ? 'Rest finished' : `Rest ${fmt(rem)} remaining`}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => patchWorkout(w.id, adjustPatch(state, -15))} aria-label="Remove 15 seconds"
          className="min-h-12 min-w-14 rounded-xl bg-surface2 font-bold active:bg-line">−15</button>
        <div className="flex-1 text-center">
          <span className={`text-3xl font-extrabold ${finished ? 'text-accent' : ''}`}>{finished ? 'Go' : fmt(rem)}</span>
          <span className="ml-2 text-xs text-muted">{finished ? 'rest done' : 'rest'}</span>
        </div>
        <button type="button" onClick={() => patchWorkout(w.id, adjustPatch(state, 15))} aria-label="Add 15 seconds"
          className="min-h-12 min-w-14 rounded-xl bg-surface2 font-bold active:bg-line">+15</button>
        <button type="button" onClick={() => patchWorkout(w.id, { restEndsAt: undefined, restDuration: undefined })} aria-label={finished ? 'Dismiss timer' : 'Skip rest'}
          className="min-h-12 rounded-xl px-3 font-semibold text-muted active:bg-surface2">{finished ? 'Hide' : 'Skip'}</button>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface2" aria-hidden>
        <div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${progress(state, now) * 100}%` }} />
      </div>
    </div>
  );
}

const adjustPatch = (s: { endsAt: number; duration: number }, delta: number) => {
  const r = adjust(s, delta, Date.now());
  return { restEndsAt: r.endsAt, restDuration: r.duration };
};

export function EditSetSheet({ set, ex, onClose }: { set: SetLog | null; ex?: Exercise; onClose: () => void }) {
  const [d, setD] = useState<SetLog | null>(set);
  const [prev, setPrev] = useState(set);
  if (set !== prev) { setPrev(set); setD(set); }
  if (!set || !d) return null;
  const step = ex && ex.increment > 0 ? ex.increment : 1;
  const save = async () => { await updateSet(set.id, { weight: d.weight, reps: d.reps, warmup: d.warmup, rpe: d.rpe, note: d.note?.trim() || undefined }); onClose(); };
  const del = async () => { await deleteSet(set.id); onClose(); };
  return (
    <Sheet open onClose={onClose} title={`Edit set · ${ex?.name ?? ''}`}>
      <div className="space-y-3">
        <Stepper label="Weight" unit="kg" value={d.weight} step={step} onChange={(v) => setD({ ...d, weight: v })} />
        <Stepper label="Reps" value={d.reps} step={1} onChange={(v) => setD({ ...d, reps: Math.round(v) })} />
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={d.warmup} onClick={() => setD({ ...d, warmup: !d.warmup })}>Warm-up</Chip>
          <span className="ml-auto text-xs text-muted">RPE</span>
          {[6, 7, 8, 9, 10].map((r) => <Chip key={r} active={d.rpe === r} onClick={() => setD({ ...d, rpe: d.rpe === r ? undefined : r })}>{r}</Chip>)}
        </div>
        <textarea className={`${field} min-h-20 py-3`} placeholder="Note (e.g. seat 4, felt shoulder)" aria-label="Set note"
          value={d.note ?? ''} onChange={(e) => setD({ ...d, note: e.target.value })} />
        <div className="flex gap-2">
          <Button variant="danger" onClick={del}>Delete</Button>
          <Button variant="primary" className="flex-1" onClick={save}>Save</Button>
        </div>
      </div>
    </Sheet>
  );
}

function FinishSheet({ open, onClose, w, sets }: { open: boolean; onClose: () => void; w: W; sets: SetLog[] }) {
  const [notes, setNotes] = useState(w.notes ?? '');
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const working = sets.filter((s) => !s.warmup);
  const volume = working.reduce((a, s) => a + s.weight * s.reps, 0);
  const prs = sets.filter((s) => s.pr?.length).length;
  const mins = Math.round((Date.now() - w.startedAt) / 60000);
  const finish = async () => { await patchWorkout(w.id, { notes: notes.trim() || undefined }); await finishWorkout(w); navigate('/', true); };
  return (
    <Sheet open={open} onClose={onClose} title="Finish workout">
      <dl className="mb-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-surface2 p-3"><dt className="text-xs text-muted">Sets</dt><dd className="text-2xl font-bold">{working.length}</dd></div>
        <div className="rounded-2xl bg-surface2 p-3"><dt className="text-xs text-muted">Volume</dt><dd className="text-2xl font-bold">{Math.round(volume / 100) / 10}t</dd></div>
        <div className="rounded-2xl bg-surface2 p-3"><dt className="text-xs text-muted">PRs</dt><dd className="text-2xl font-bold">{prs}</dd></div>
      </dl>
      <p className="mb-2 text-sm text-muted">{mins} min. Unfinished exercises are fine. What you did is what counts.</p>
      <textarea className={`${field} min-h-20 py-3`} placeholder="Workout notes (optional)" aria-label="Workout notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <Button variant="primary" className="mt-3 h-14 w-full" onClick={finish}>Save workout</Button>
      {confirmDiscard ? (
        <Button variant="danger" className="mt-2 w-full" onClick={async () => { await discardWorkout(w); navigate('/', true); }}>Tap again to delete this workout and its sets</Button>
      ) : (
        <Button variant="ghost" className="mt-2 w-full text-muted" onClick={() => setConfirmDiscard(true)}>Discard workout</Button>
      )}
    </Sheet>
  );
}
