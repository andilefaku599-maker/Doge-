import { useEffect, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-ink font-bold active:brightness-90',
  secondary: 'bg-surface2 text-ink font-semibold active:bg-line',
  ghost: 'bg-transparent text-ink active:bg-surface2',
  danger: 'bg-transparent text-danger border border-danger/50 font-semibold active:bg-danger/10',
};

export function Button({ variant = 'secondary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" {...p} className={`min-h-12 rounded-2xl px-4 text-base ${variants[variant]} ${className}`} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-surface p-4 ${className}`}>{children}</section>;
}

export function Header({ title, onBack, right }: { title: string; onBack?: () => void; right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 bg-bg/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur">
      {onBack ? (
        <button type="button" onClick={onBack} aria-label="Back" className="grid size-12 place-items-center rounded-full text-2xl active:bg-surface2">‹</button>
      ) : <span className="w-2" />}
      <h1 className="flex-1 truncate text-xl font-bold">{title}</h1>
      {right}
    </header>
  );
}

/** Bottom sheet modal. Closes on backdrop tap or Escape. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    addEventListener('keydown', k);
    ref.current?.focus();
    return () => removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="pb-safe max-h-[88vh] overflow-y-auto rounded-t-3xl border-t border-line bg-surface px-4 pt-3 outline-none"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" aria-hidden />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-12 px-3 text-muted" aria-label="Close">Close</button>
        </div>
        <div className="pb-4">{children}</div>
      </div>
    </div>
  );
}

/** Big −/value/+ control. The value can also be typed. */
export function Stepper({ label, value, onChange, step, min = 0, unit, decimals = 1 }: {
  label: string; value: number; onChange: (v: number) => void; step: number; min?: number; unit?: string; decimals?: number;
}) {
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(decimals).replace(/\.?0+$/, ''));
  const set = (v: number) => onChange(Math.max(min, Math.round(v * 100) / 100));
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" aria-label={`Decrease ${label} by ${step}`} onClick={() => set(value - step)}
        className="grid size-16 shrink-0 place-items-center rounded-2xl bg-surface2 text-3xl font-bold active:bg-line">−</button>
      <label className="flex min-w-0 flex-1 flex-col items-center">
        <span className="text-xs uppercase tracking-wide text-muted">{label}{unit ? ` (${unit})` : ''}</span>
        <span className="flex w-full items-baseline">
          <NumInput aria-label={label} value={value} format={fmt} onValue={set}
            className="w-full min-w-0 bg-transparent text-center text-4xl font-extrabold outline-none" />
        </span>
      </label>
      <button type="button" aria-label={`Increase ${label} by ${step}`} onClick={() => set(value + step)}
        className="grid size-16 shrink-0 place-items-center rounded-2xl bg-surface2 text-3xl font-bold active:bg-line">+</button>
    </div>
  );
}

export function Chip({ active, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button type="button" aria-pressed={active} {...p}
      className={`min-h-11 min-w-11 rounded-full px-3 text-sm font-semibold ${active ? 'bg-accent text-accent-ink' : 'bg-surface2 text-ink'}`}>
      {children}
    </button>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-3xl border border-dashed border-line p-6 text-center">
      <p className="font-semibold">{title}</p>
      {children && <div className="mt-2 text-sm text-muted">{children}</div>}
    </div>
  );
}

export const field = 'min-h-12 w-full rounded-2xl bg-surface2 px-4 text-base text-ink outline-none placeholder:text-muted focus:ring-2 focus:ring-accent';

/**
 * Numeric text input that tolerates partial typing ("82." or "") and accepts a comma
 * decimal separator. Commits valid numbers as you type; re-syncs on blur.
 */
export function NumInput({ value, onValue, format = String, ...p }: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number; onValue: (v: number) => void; format?: (v: number) => string;
}) {
  const [text, setText] = useState(format(value));
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : format(value);
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      {...p}
      value={shown}
      onFocus={(e) => { setText(format(value)); setFocused(true); e.target.select(); }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const t = e.target.value.replace(',', '.').replace(/[^0-9.]/g, '');
        setText(t);
        const v = parseFloat(t);
        if (!Number.isNaN(v)) onValue(v);
      }}
    />
  );
}
