import { CATEGORY_ORDER, CATEGORY_LABEL, type CategoryCode } from "@/lib/rehox/types";

interface DialDatum {
  code: CategoryCode;
  required: number; // 0-10
  candidate: number; // 0-10
}

interface Props {
  data: DialDatum[];
  size?: number;
  animate?: boolean;
  compact?: boolean;
  showLabels?: boolean;
}

/**
 * 12-spoke radial dial. Required level = thin outer ring at that radius.
 * Candidate level = filled wedge from center outward.
 */
export function SkillDial({ data, size = 420, animate = true, compact = false, showLabels = true }: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const outer = size * 0.42;
  const inner = size * 0.10;
  const n = 12;
  const gap = 0.02; // radians
  const step = (Math.PI * 2) / n;

  // Order categories consistently, fill missing with 0
  const byCode = new Map(data.map((d) => [d.code, d]));
  const ordered = CATEGORY_ORDER.map((c) => byCode.get(c) ?? { code: c, required: 0, candidate: 0 });

  const wedges = ordered.map((d, i) => {
    // Start at top (-PI/2), go clockwise
    const a0 = -Math.PI / 2 + i * step + gap / 2;
    const a1 = -Math.PI / 2 + (i + 1) * step - gap / 2;
    const rCand = inner + (outer - inner) * (Math.max(0, d.candidate) / 10);
    const rReq = inner + (outer - inner) * (Math.max(0, d.required) / 10);
    return { i, code: d.code, a0, a1, rCand, rReq, req: d.required, cand: d.candidate };
  });

  const arc = (r: number, a0: number, a1: number, r0 = inner) => {
    const x0 = cx + Math.cos(a0) * r;
    const y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    const xi0 = cx + Math.cos(a1) * r0;
    const yi0 = cy + Math.sin(a1) * r0;
    const xi1 = cx + Math.cos(a0) * r0;
    const yi1 = cy + Math.sin(a0) * r0;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1} L ${xi0} ${yi0} A ${r0} ${r0} 0 ${large} 0 ${xi1} ${yi1} Z`;
  };

  const ringArc = (r: number, a0: number, a1: number) => {
    const x0 = cx + Math.cos(a0) * r;
    const y0 = cy + Math.sin(a0) * r;
    const x1 = cx + Math.cos(a1) * r;
    const y1 = cy + Math.sin(a1) * r;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="12-skillset radial dial"
      className="max-w-full"
    >
      {/* Faint spokes */}
      {wedges.map((w) => {
        const mid = (w.a0 + w.a1) / 2;
        const x1 = cx + Math.cos(mid) * inner;
        const y1 = cy + Math.sin(mid) * inner;
        const x2 = cx + Math.cos(mid) * outer;
        const y2 = cy + Math.sin(mid) * outer;
        return (
          <line key={`sp-${w.i}`} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="var(--line)" strokeWidth={1} opacity={0.5} />
        );
      })}

      {/* Outer scale ring */}
      <circle cx={cx} cy={cy} r={outer} fill="none" stroke="var(--line)" strokeWidth={1} opacity={0.6} />
      <circle cx={cx} cy={cy} r={inner} fill="none" stroke="var(--line)" strokeWidth={1} opacity={0.4} />

      {/* Candidate wedges (brass fill) */}
      {wedges.map((w) => (
        <path
          key={`c-${w.i}`}
          d={arc(Math.max(inner + 0.5, w.rCand), w.a0, w.a1)}
          fill="var(--brass)"
          fillOpacity={0.85}
          className={animate ? "rehox-sweep" : undefined}
          style={animate ? {
            transformOrigin: `${cx}px ${cy}px`,
            animation: `rehox-wedge-in 600ms cubic-bezier(.2,.7,.2,1) ${w.i * 40}ms both`,
          } : undefined}
        />
      ))}

      {/* Required ring arcs — the "X" to hit */}
      {wedges.map((w) => (
        w.req > 0 ? (
          <path key={`r-${w.i}`} d={ringArc(w.rReq, w.a0, w.a1)}
            fill="none" stroke="var(--ink-text)" strokeWidth={2} strokeLinecap="round" />
        ) : null
      ))}

      {/* Category labels */}
      {showLabels && wedges.map((w) => {
        const mid = (w.a0 + w.a1) / 2;
        const rLbl = outer + (compact ? 12 : 18);
        const x = cx + Math.cos(mid) * rLbl;
        const y = cy + Math.sin(mid) * rLbl;
        return (
          <text key={`t-${w.i}`} x={x} y={y}
            fill="var(--muted-text)"
            fontFamily="var(--font-mono)"
            fontSize={compact ? 9 : 10}
            textAnchor="middle" dominantBaseline="middle"
            letterSpacing="0.08em">
            {w.code}
          </text>
        );
      })}

      <style>{`
        @keyframes rehox-wedge-in {
          from { opacity: 0; transform: scale(0.2); }
          to   { opacity: 0.85; transform: scale(1); }
        }
      `}</style>
    </svg>
  );
}

export default SkillDial;