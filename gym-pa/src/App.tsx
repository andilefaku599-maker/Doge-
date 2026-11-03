import { useEffect, useState } from 'react';
import { UpdatePrompt } from './components/UpdatePrompt';
import { Empty, Header } from './components/ui';
import { requestPersistence, seed } from './lib/db';
import { navigate, useRoute } from './router';
import Progress, { ExerciseDetail } from './screens/Progress';
import Settings from './screens/Settings';
import Today from './screens/Today';
import Train, { RoutineEdit } from './screens/Train';
import Workout from './screens/Workout';

const TABS = [
  { path: '/', label: 'Today', icon: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6H9v6H4a1 1 0 01-1-1z' },
  { path: '/train', label: 'Train', icon: 'M2 10h3v4H2zM19 10h3v4h-3zM5 7h3v10H5zM16 7h3v10h-3zM8 11h8v2H8z' },
  { path: '/food', label: 'Food', icon: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 3a6 6 0 110 12 6 6 0 010-12z' },
  { path: '/progress', label: 'Progress', icon: 'M3 20h18v-2H3zM5 16l4-5 4 3 6-8 1.6 1.2-7.2 9.6-4-3-2.8 3.4z' },
  { path: '/settings', label: 'Settings', icon: 'M12 8a4 4 0 100 8 4 4 0 000-8zm8.9 5l1.6 1.3-2 3.4-2-.7a7 7 0 01-1.6.9L16.5 20h-4l-.4-2.1a7 7 0 01-1.6-.9l-2 .7-2-3.4L8.1 13a7 7 0 010-2L6.5 9.7l2-3.4 2 .7c.5-.4 1-.7 1.6-.9L12.5 4h4l.4 2.1c.6.2 1.1.5 1.6.9l2-.7 2 3.4L20.9 11a7 7 0 010 2z' },
];

function NavBar({ pathname }: { pathname: string }) {
  return (
    <nav aria-label="Main" className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg">
      <ul className="mx-auto flex max-w-xl">
        {TABS.map((t) => {
          const active = t.path === '/' ? pathname === '/' : pathname.startsWith(t.path);
          return (
            <li key={t.path} className="flex-1">
              <button type="button" onClick={() => navigate(t.path)} aria-current={active ? 'page' : undefined}
                className={`flex h-16 w-full flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? 'text-accent' : 'text-muted'}`}>
                <svg viewBox="0 0 24 24" className="size-6" fill="currentColor" aria-hidden><path d={t.icon} fillRule="evenodd" /></svg>
                {t.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default function App() {
  const { pathname, query } = useRoute();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    seed().then(() => setReady(true)).catch((e) => setError(String(e?.message ?? e)));
    requestPersistence();
  }, []);

  if (error) return <div className="p-6"><Empty title="Couldn't open local storage">{error}. Private/incognito mode can block storage. Open Spotter normally.</Empty></div>;
  if (!ready) return <div className="p-6 text-muted" role="status">Loading…</div>;

  let screen;
  let nav = true;
  const seg = pathname.split('/').filter(Boolean);
  if (pathname === '/') screen = <Today />;
  else if (seg[0] === 'workout') { screen = <Workout start={query.get('start')} />; nav = false; }
  else if (seg[0] === 'train' && seg[1]) screen = <RoutineEdit id={seg[1]} />;
  else if (seg[0] === 'train') screen = <Train />;
  else if (seg[0] === 'progress' && seg[1]) screen = <ExerciseDetail id={seg[1]} />;
  else if (seg[0] === 'progress') screen = <Progress tab={query.get('tab')} />;
  else if (seg[0] === 'settings') screen = <Settings />;
  else if (seg[0] === 'food') screen = (
    <div><Header title="Food" /><div className="px-4"><Empty title="Diet tracking arrives in Phase 2">Recent foods, saved meals, SA food database, quick-add, water, alcohol and weight trend.</Empty></div></div>
  );
  else screen = <div className="p-6"><Empty title="Page not found" /></div>;

  return (
    <div className="mx-auto min-h-full max-w-xl">
      <UpdatePrompt />
      <main>{screen}</main>
      {nav && <NavBar pathname={pathname} />}
    </div>
  );
}
