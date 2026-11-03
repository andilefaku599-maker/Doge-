import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Button, Card, Chip, Header, NumInput } from '../components/ui';
import { db } from '../lib/db';
import { suggestTargets } from '../lib/targets';
import type { Profile } from '../lib/types';

const numField = (label: string, value: number, onChange: (v: number) => void, unit?: string) => (
  <label className="flex items-center justify-between gap-3">
    <span>{label}</span>
    <span className="flex items-center gap-2">
      <NumInput aria-label={label} value={value} onValue={onChange}
        className="min-h-12 w-24 rounded-xl bg-surface2 text-center text-lg font-semibold outline-none focus:ring-2 focus:ring-accent" />
      {unit && <span className="w-8 text-sm text-muted">{unit}</span>}
    </span>
  </label>
);

export default function Settings() {
  const p = useLiveQuery(() => db.profile.get('me'), []);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  useEffect(() => { navigator.storage?.persisted?.().then(setPersisted).catch(() => setPersisted(null)); }, []);
  if (!p) return <div className="p-6 text-muted" role="status">Loading…</div>;
  const save = (patch: Partial<Profile>) => db.profile.update('me', patch);
  const sug = suggestTargets(p);

  return (
    <div className="pb-24">
      <Header title="Settings" />
      <div className="space-y-3 px-4">
        <Card className="space-y-3">
          <h2 className="font-bold">About you</h2>
          {numField('Height', p.heightCm, (v) => save({ heightCm: v }), 'cm')}
          {numField('Weight', p.weightKg, (v) => save({ weightKg: v }), 'kg')}
          {numField('Age', p.age, (v) => save({ age: v }), 'yrs')}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Goal">
            {(['recomp', 'cut', 'maintain', 'bulk'] as const).map((g) => (
              <Chip key={g} active={p.goal === g} onClick={() => save({ goal: g })} className="capitalize">{g}</Chip>
            ))}
          </div>
        </Card>

        <Card className="space-y-3">
          <h2 className="font-bold">Daily targets</h2>
          {numField('Calories', p.kcalTarget, (v) => save({ kcalTarget: v }), 'kcal')}
          {numField('Protein', p.proteinTarget, (v) => save({ proteinTarget: v }), 'g')}
          {numField('Alcohol cap', p.alcoholCapPerDay, (v) => save({ alcoholCapPerDay: v }), 'drinks')}
          <p className="text-sm text-muted">
            Estimate from your stats: maintenance ≈ {sug.tdee} kcal. Suggested start: {sug.kcal} kcal and {sug.protein} g protein.
            Treat it as a starting point. Your 7-day weight trend (Phase 2) is the real judge.
          </p>
          {(sug.kcal !== p.kcalTarget || sug.protein !== p.proteinTarget) && (
            <Button className="w-full" onClick={() => save({ kcalTarget: sug.kcal, proteinTarget: sug.protein })}>Use suggested targets</Button>
          )}
          <p className="text-xs text-muted">General guidance only, not medical advice. For pain, injury or medical conditions, see a doctor, physio or dietitian.</p>
        </Card>

        <Card className="space-y-1 text-sm">
          <h2 className="font-bold">Storage</h2>
          <p className="text-muted">All data lives on this phone. {persisted === true ? 'Persistent storage is on, so the browser won’t clear it under storage pressure.' : persisted === false ? 'Persistent storage was not granted. Installing the app to your home screen usually fixes this.' : 'Checking…'}</p>
          <p className="text-muted">Export and backup arrive in Phase 4.</p>
          <p className="pt-2 text-xs text-muted">Spotter v{__APP_VERSION__}</p>
        </Card>
      </div>
    </div>
  );
}
