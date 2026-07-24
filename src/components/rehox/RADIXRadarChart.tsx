import { useId } from "react";
import { CATEGORY_ORDER, CATEGORY_LABEL, type CategoryCode } from "@/lib/rehox/types";

interface RadarDatum {
  code: CategoryCode;
  required: number; // 0-10
  candidate: number; // 0-10
}

interface Props {
  data: RadarDatum[];
  size?: number;
  showLegend?: boolean;
}

export function RADIXRadarChart({ data, size = 480, showLegend = true }: Props) {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, "");
  const candGradId = `candidate-grad-${safeId}`;
  const reqGradId = `required-grad-${safeId}`;
  const glowCandId = `glow-candidate-${safeId}`;
  const glowBrassId = `glow-brass-${safeId}`;

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const levelsCount = 5; // 2, 4, 6, 8, 10
  const totalSpokes = 12;

  const byCode = new Map(data.map((d) => [d.code, d]));
  const ordered = CATEGORY_ORDER.map(
    (c) => byCode.get(c) ?? { code: c, required: 5, candidate: 0 },
  );

  // Calculate spoke angle (-90deg at top, clockwise)
  const getCoordinates = (index: number, levelValue: number) => {
    const angle = (Math.PI * 2 * index) / totalSpokes - Math.PI / 2;
    const r = (radius * Math.max(0, Math.min(10, levelValue))) / 10;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
    };
  };

  // Build SVG polygon points
  const candidatePoints = ordered
    .map((d, i) => {
      const pt = getCoordinates(i, d.candidate);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");

  const requiredPoints = ordered
    .map((d, i) => {
      const pt = getCoordinates(i, d.required);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");

  return (
    <div className="relative flex flex-col items-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="max-w-full overflow-visible drop-shadow-xl"
        role="img"
        aria-label="RADIX 12-Category Competency Radar Chart"
      >
        <defs>
          <linearGradient id={candGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
          </linearGradient>

          <linearGradient id={reqGradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c98a3e" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.05" />
          </linearGradient>

          <filter id={glowCandId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id={glowBrassId} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Concentric Grid Web Circles (Levels 2, 4, 6, 8, 10) */}
        {[...Array(levelsCount)].map((_, idx) => {
          const levelVal = (idx + 1) * 2;
          const r = (radius * levelVal) / 10;
          return (
            <g key={`grid-${levelVal}`}>
              <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke="var(--line)"
                strokeWidth={1}
                strokeDasharray={levelVal === 10 ? "none" : "2 3"}
                opacity={levelVal === 10 ? 0.6 : 0.35}
              />
              <text
                x={cx + 4}
                y={cy - r + 3}
                fill="var(--muted-text)"
                fontSize="9"
                fontFamily="var(--font-mono)"
                opacity={0.5}
              >
                L{levelVal}
              </text>
            </g>
          );
        })}

        {/* Spokes */}
        {ordered.map((d, i) => {
          const pt = getCoordinates(i, 10);
          return (
            <line
              key={`spoke-${i}`}
              x1={cx}
              y1={cy}
              x2={pt.x}
              y2={pt.y}
              stroke="var(--line)"
              strokeWidth={1}
              opacity={0.35}
            />
          );
        })}

        {/* Required Target Polygon (Gold Dashed) */}
        <polygon
          points={requiredPoints}
          fill={`url(#${reqGradId})`}
          stroke="#c98a3e"
          strokeWidth={2}
          strokeDasharray="4 3"
          strokeOpacity={0.85}
          filter={`url(#${glowBrassId})`}
        />

        {/* Candidate Capability Polygon (Green/Blue Gradient Fill) */}
        <polygon
          points={candidatePoints}
          fill={`url(#${candGradId})`}
          stroke="#10b981"
          strokeWidth={2.5}
          strokeLinejoin="round"
          filter={`url(#${glowCandId})`}
          className="transition-all duration-700 ease-out"
        />

        {/* Required Vertex Dots (Gold) */}
        {ordered.map((d, i) => {
          const pt = getCoordinates(i, d.required);
          return (
            <circle
              key={`req-pt-${i}`}
              cx={pt.x}
              cy={pt.y}
              r={3}
              fill="#c98a3e"
              stroke="#0f172a"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Candidate Vertex Dots (Green Glowing) */}
        {ordered.map((d, i) => {
          const pt = getCoordinates(i, d.candidate);
          const isMet = d.candidate >= d.required;
          return (
            <g key={`cand-pt-${i}`}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={4.5}
                fill={isMet ? "#10b981" : "#f59e0b"}
                stroke="#0f172a"
                strokeWidth={2}
                className="transition-all duration-500"
              />
            </g>
          );
        })}

        {/* Spoke Category Labels */}
        {ordered.map((d, i) => {
          const angle = (Math.PI * 2 * i) / totalSpokes - Math.PI / 2;
          const labelR = radius + 24;
          const lx = cx + labelR * Math.cos(angle);
          const ly = cy + labelR * Math.sin(angle);
          const isGap = d.candidate < d.required;

          return (
            <g key={`label-${i}`} transform={`translate(${lx}, ${ly})`}>
              <rect
                x={-20}
                y={-10}
                width={40}
                height={20}
                rx={6}
                fill={isGap ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)"}
                stroke={isGap ? "rgba(245, 158, 11, 0.4)" : "rgba(16, 185, 129, 0.4)"}
                strokeWidth={1}
              />
              <text
                x={0}
                y={1.5}
                fill={isGap ? "#f59e0b" : "#10b981"}
                fontSize="10"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {d.code}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend Bar */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-6 rounded-xl border border-line/60 bg-panel/60 px-5 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            <span className="font-semibold text-ink-text">Candidate Competency</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full border border-dashed border-brass bg-brass/20" />
            <span className="font-semibold text-brass">Target Requirement</span>
          </div>
        </div>
      )}
    </div>
  );
}
