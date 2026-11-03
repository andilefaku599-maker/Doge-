import { useEffect, useState } from 'react';

/** Re-render every `ms` while enabled, and immediately on returning to the foreground. Time comes from Date.now(). */
export function useNow(enabled: boolean, ms = 250) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!enabled) return;
    const tick = () => setNow(Date.now());
    const id = setInterval(tick, ms);
    document.addEventListener('visibilitychange', tick);
    tick();
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [enabled, ms]);
  return now;
}

type Sentinel = { release: () => Promise<void>; released: boolean };

/** Keep the screen on while `active`. The browser drops the lock when hidden, so re-acquire on return. */
export function useWakeLock(active: boolean) {
  const [supported] = useState(() => typeof navigator !== 'undefined' && 'wakeLock' in navigator);
  useEffect(() => {
    if (!active || !supported) return;
    let lock: Sentinel | null = null;
    let cancelled = false;
    const acquire = async () => {
      if (document.visibilityState !== 'visible' || (lock && !lock.released)) return;
      try {
        lock = await (navigator as unknown as { wakeLock: { request: (t: 'screen') => Promise<Sentinel> } }).wakeLock.request('screen');
        if (cancelled) lock.release();
      } catch { /* low battery mode or denied: fine, just no wake lock */ }
    };
    acquire();
    document.addEventListener('visibilitychange', acquire);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', acquire); lock?.release().catch(() => {}); };
  }, [active, supported]);
  return supported;
}

export const vibrate = (pattern: number | number[]) => {
  try { if ('vibrate' in navigator) navigator.vibrate(pattern); } catch { /* unsupported */ }
};

export const kg = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/\.?0+$/, ''));
