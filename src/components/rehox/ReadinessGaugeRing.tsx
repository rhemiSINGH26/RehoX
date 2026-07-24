import React from "react";

interface Props {
  score: number; // 0 - 100
  size?: number;
  label?: string;
  sublabel?: string;
}

export function ReadinessGaugeRing({
  score,
  size = 220,
  label = "Readiness Score",
  sublabel = "out of 100",
}: Props) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  // Dynamic color palette based on score range
  const getTheme = () => {
    if (clampedScore >= 80) {
      return {
        gradient: ["#10b981", "#059669"],
        text: "text-emerald-400",
        glow: "shadow-emerald-500/20",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        status: "Interview Ready",
      };
    }
    if (clampedScore >= 65) {
      return {
        gradient: ["#c98a3e", "#f59e0b"],
        text: "text-brass",
        glow: "shadow-amber-500/20",
        bg: "bg-brass/10",
        border: "border-brass/30",
        status: "Nearly Ready",
      };
    }
    return {
      return: {
        gradient: ["#f43f5e", "#e11d48"],
        text: "text-rose-400",
        glow: "shadow-rose-500/20",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        status: "Significant Skill Gaps",
      },
    };
  };

  const theme = getTheme() || {
    gradient: ["#c98a3e", "#f59e0b"],
    text: "text-brass",
    glow: "shadow-amber-500/20",
    bg: "bg-brass/10",
    border: "border-brass/30",
    status: "Developing",
  };

  return (
    <div className="relative flex flex-col items-center justify-center">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 drop-shadow-md"
      >
        <defs>
          <linearGradient id={`gauge-grad-${score}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={theme.gradient[0]} />
            <stop offset="100%" stopColor={theme.gradient[1]} />
          </linearGradient>
        </defs>

        {/* Track Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />

        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#gauge-grad-${score})`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>

      {/* Center Score & Text Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="mono text-[10px] uppercase tracking-widest text-muted-text font-semibold">
          {label}
        </span>
        <div className={`font-display text-5xl font-extrabold tracking-tight ${theme.text}`}>
          {clampedScore}
          <span className="text-xl font-normal text-muted-text/80">%</span>
        </div>
        <span className="text-[11px] text-muted-text mt-0.5">{sublabel}</span>
      </div>
    </div>
  );
}
