import { useRegisterSW } from 'virtual:pwa-register/react';

/** Shows a banner when a new version has been downloaded. Data is untouched by updates. */
export function UpdatePrompt() {
  const { needRefresh: [needRefresh, setNeedRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Check for updates hourly while the app is open.
      if (reg) setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    },
  });
  if (!needRefresh) return null;
  return (
    <div role="alert" className="fixed inset-x-3 top-3 z-[60] flex items-center gap-3 rounded-2xl border border-accent/50 bg-surface p-3 shadow-lg">
      <p className="flex-1 text-sm">A new version of Spotter is ready.</p>
      <button type="button" className="min-h-11 px-2 text-sm text-muted" onClick={() => setNeedRefresh(false)}>Later</button>
      <button type="button" className="min-h-11 rounded-xl bg-accent px-3 text-sm font-bold text-accent-ink" onClick={() => updateServiceWorker(true)}>Update</button>
    </div>
  );
}
