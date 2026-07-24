import { Link, useRouterState } from "@tanstack/react-router";
import { useRehox } from "@/lib/rehox/store";
import type { ReactNode } from "react";

const NODES = [
  { key: "jd", label: "JD", to: "/jd" as const },
  { key: "resume", label: "Resume", to: "/resume" as const },
  { key: "profile", label: "Profile", to: "/profile" as const },
  { key: "talent", label: "Talent Check", to: "/talent-check" as const },
  { key: "match", label: "Skill Match", to: "/skill-match" as const },
];

function Wordmark() {
  return (
    <Link to="/" className="group flex items-center gap-2.5 font-display text-lg font-bold tracking-tight text-ink-text">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-brass/40 bg-gradient-to-br from-brass/20 to-brass/5 shadow-sm group-hover:border-brass transition-colors">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brass">
          <circle cx="12" cy="12" r="9" strokeOpacity="0.4" />
          <path d="M12 3v3m0 12v3M3 12h3m12 0h3" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </div>
      <span>Reho<span className="text-brass">X</span></span>
    </Link>
  );
}

function Pipeline() {
  const { jd, resume, profile, talentCheck, skillMatch } = useRehox((s) => s);
  const ready = { jd: !!jd, resume: !!resume, profile: !!profile, talent: !!talentCheck, match: !!skillMatch };
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="RehoX pipeline" className="flex items-center gap-2 md:gap-3 overflow-x-auto">
      {NODES.map((n, i) => {
        const active = ready[n.key as keyof typeof ready];
        const current = pathname === n.to;
        return (
          <div key={n.key} className="flex items-center gap-2 md:gap-3">
            <Link
              to={n.to}
              className={[
                "group flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-brass/60 bg-brass/10 text-brass rehox-pulse-once"
                  : current
                    ? "border-line text-ink-text bg-panel"
                    : "border-line text-muted-text hover:text-ink-text",
              ].join(" ")}
            >
              <span className="mono text-[10px] tracking-widest">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{n.label}</span>
            </Link>
            {i < NODES.length - 1 && (
              <span
                aria-hidden
                className={[
                  "hidden md:block h-px w-6 transition-colors",
                  active ? "bg-brass/60" : "bg-line",
                ].join(" ")}
              />
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes rehox-pulse { 0% { box-shadow: 0 0 0 0 rgba(201,138,62,.4);} 100% { box-shadow: 0 0 0 8px rgba(201,138,62,0);} }
        .rehox-pulse-once { animation: rehox-pulse 700ms ease-out 1; }
      `}</style>
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-line bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-8">
          <Wordmark />
          <div className="min-w-0 md:flex-1 md:px-6">
            <Pipeline />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full border border-line bg-panel grid place-items-center mono text-xs text-muted-text">
              YC
            </div>
            <div className="hidden md:block text-xs text-muted-text mono">candidate.local</div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">{children}</main>
      <footer className="mx-auto max-w-7xl px-4 pb-10 pt-4 text-xs text-muted-text md:px-8">
        <span className="mono">RehoX · precision readiness · v0.1</span>
      </footer>
    </div>
  );
}

export default AppShell;