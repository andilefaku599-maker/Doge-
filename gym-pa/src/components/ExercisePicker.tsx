import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import { db } from '../lib/db';
import { uid } from '../lib/id';
import { DEFAULT_INCREMENT } from '../lib/library';
import type { Equipment, Exercise } from '../lib/types';
import { Button, Sheet, field } from './ui';

const EQUIPMENT: Equipment[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'];

/** Searchable exercise list. Same-muscle exercises are listed first (useful for swaps). */
export function ExercisePicker({ open, onClose, onPick, title = 'Choose exercise', preferMuscle }: {
  open: boolean; onClose: () => void; onPick: (e: Exercise) => void; title?: string; preferMuscle?: string;
}) {
  const all = useLiveQuery(() => db.exercises.toArray(), []) ?? [];
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState(preferMuscle ?? '');
  const [equipment, setEquipment] = useState<Equipment>('machine');

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return all
      .filter((e) => !t || e.name.toLowerCase().includes(t) || e.muscle.toLowerCase().includes(t))
      .sort((a, b) =>
        (preferMuscle ? Number(b.muscle === preferMuscle) - Number(a.muscle === preferMuscle) : 0) ||
        a.muscle.localeCompare(b.muscle) || a.name.localeCompare(b.name));
  }, [all, q, preferMuscle]);

  const create = async () => {
    if (!name.trim()) return;
    const e: Exercise = { id: uid(), name: name.trim(), muscle: muscle.trim() || 'Other', equipment, increment: DEFAULT_INCREMENT[equipment], rest: 90, custom: true };
    await db.exercises.put(e);
    setCreating(false); setName(''); onPick(e);
  };

  return (
    <Sheet open={open} onClose={onClose} title={title}>
      {creating ? (
        <div className="space-y-3">
          <input className={field} placeholder="Exercise name" value={name} onChange={(e) => setName(e.target.value)} aria-label="Exercise name" autoFocus />
          <input className={field} placeholder="Muscle group (e.g. Chest)" value={muscle} onChange={(e) => setMuscle(e.target.value)} aria-label="Muscle group" />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Equipment">
            {EQUIPMENT.map((eq) => (
              <button key={eq} type="button" aria-pressed={equipment === eq} onClick={() => setEquipment(eq)}
                className={`min-h-11 rounded-full px-3 text-sm capitalize ${equipment === eq ? 'bg-accent text-accent-ink font-bold' : 'bg-surface2'}`}>{eq}</button>
            ))}
          </div>
          <p className="text-sm text-muted">Weight step: {DEFAULT_INCREMENT[equipment] || 'reps only'}{DEFAULT_INCREMENT[equipment] ? ' kg' : ''}. Change it later under Progress.</p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => setCreating(false)}>Cancel</Button>
            <Button variant="primary" className="flex-1" onClick={create} disabled={!name.trim()}>Create</Button>
          </div>
        </div>
      ) : (
        <>
          <input className={field} placeholder="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search exercises" />
          <Button className="mt-2 w-full" onClick={() => { setName(q); setCreating(true); }}>+ Custom exercise</Button>
          <ul className="mt-2 divide-y divide-line">
            {list.map((e) => (
              <li key={e.id}>
                <button type="button" onClick={() => onPick(e)} className="flex min-h-14 w-full items-center justify-between gap-2 px-1 text-left active:bg-surface2">
                  <span className="font-medium">{e.name}</span>
                  <span className="shrink-0 text-xs text-muted">{e.muscle}{e.custom ? ' · custom' : ''}</span>
                </button>
              </li>
            ))}
            {!list.length && <li className="py-4 text-center text-muted">No match. Create it as a custom exercise.</li>}
          </ul>
        </>
      )}
    </Sheet>
  );
}
