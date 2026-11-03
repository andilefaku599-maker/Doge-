/** Minimal dependency-free SVG line chart. Works offline and stays light. */
export interface Point { x: number; y: number }

export function LineChart({ series, label, unit = 'kg', height = 180 }: {
  series: { name: string; points: Point[]; color: string; dashed?: boolean }[];
  label: string; unit?: string; height?: number;
}) {
  const pts = series.flatMap((s) => s.points);
  if (pts.length < 2) return <p className="py-6 text-center text-sm text-muted">Log at least two sessions to see a chart.</p>;
  const W = 340, H = height, P = { l: 40, r: 10, t: 10, b: 24 };
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = Math.max(1, (y1 - y0) * 0.1); y0 = Math.max(0, y0 - pad); y1 += pad;
  const sx = (x: number) => P.l + ((x - x0) / (x1 - x0 || 1)) * (W - P.l - P.r);
  const sy = (y: number) => P.t + (1 - (y - y0) / (y1 - y0 || 1)) * (H - P.t - P.b);
  const d = (p: Point[]) => p.map((q, i) => `${i ? 'L' : 'M'}${sx(q.x).toFixed(1)},${sy(q.y).toFixed(1)}`).join('');
  const date = (t: number) => new Date(t).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' });
  const ticks = [y0, (y0 + y1) / 2, y1];
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={P.l} x2={W - P.r} y1={sy(t)} y2={sy(t)} stroke="#2b333d" strokeWidth="1" />
            <text x={P.l - 6} y={sy(t) + 4} textAnchor="end" fontSize="11" fill="#a3adba">{Math.round(t)}</text>
          </g>
        ))}
        <text x={P.l} y={H - 6} fontSize="11" fill="#a3adba">{date(x0)}</text>
        <text x={W - P.r} y={H - 6} fontSize="11" fill="#a3adba" textAnchor="end">{date(x1)}</text>
        {series.map((s) => (
          <g key={s.name}>
            <path d={d(s.points)} fill="none" stroke={s.color} strokeWidth="2.5" strokeDasharray={s.dashed ? '5 4' : undefined} strokeLinejoin="round" />
            {s.points.map((p) => <circle key={p.x} cx={sx(p.x)} cy={sy(p.y)} r="3.5" fill={s.color} />)}
          </g>
        ))}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4 text-xs text-muted">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-4" style={{ background: s.color }} aria-hidden />{s.name} ({unit})
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
