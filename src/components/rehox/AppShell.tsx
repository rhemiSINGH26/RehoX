import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import type { ReactNode } from "react";

const NODES = [
  { key: "jd", label: "JD", to: "/jd" as const },
  { key: "resume", label: "Resume", to: "/resume" as const },
  { key: "profile", label: "Profile", to: "/profile" as const },
  { key: "talent", label: "Talent Check", to: "/talent-check" as const },
  { key: "match", label: "Skill Match", to: "/skill-match" as const },
  { key: "report", label: "Report", to: "/report" as const },
  { key: "ats", label: "ATS Resume", to: "/resume-builder" as const },
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
  const userSession = useRehox((s) => s.userSession);
  const { jd, resume, profile, talentCheck, skillMatch } = useRehox((s) => s);

  if (!userSession) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-text mono italic">
        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        <span>Authentication Required to Unlock Pipeline</span>
      </div>
    );
  }

  const ready = {
    jd: !!jd,
    resume: !!resume,
    profile: !!profile,
    talent: !!talentCheck,
    match: !!skillMatch,
    report: !!(talentCheck || skillMatch),
    ats: !!profile,
  };
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav aria-label="RehoX pipeline" className="flex items-center gap-2 md:gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {NODES.map((n, i) => {
        const active = ready[n.key as keyof typeof ready];
        const current = pathname === n.to;
        return (
          <div key={n.key} className="flex items-center gap-2 md:gap-3">
            <Link
              to={n.to}
              className={[
                "group flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
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
                  "hidden md:block h-px w-4 transition-colors",
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

function UserBadge() {
  const profile = useRehox((s) => s.profile);
  const resume = useRehox((s) => s.resume);
  const userSession = useRehox((s) => s.userSession);
  const savedAnalyses = useRehox((s) => s.savedAnalyses);
  const activeAnalysisId = useRehox((s) => s.activeAnalysisId);

  const [showDrawer, setShowDrawer] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!userSession) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-2 rounded-xl bg-brass px-4 py-2 text-xs font-bold text-primary-foreground shadow hover:brightness-110 active:scale-95 transition-all"
      >
        <span>Sign In / Login →</span>
      </Link>
    );
  }

  const rawName = userSession.name || profile?.name || resume?.name || (resume?.displayName ? resume.displayName.split("—")[0].trim() : "");
  
  const initials = rawName
    ? rawName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "RX";

  const label = rawName ? rawName : "Candidate Session";

  function handleSaveAnalysis() {
    rehoxStore.saveCurrentAnalysis();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1500);
  }

  function handleLogout() {
    rehoxStore.logout();
    setShowDrawer(false);
  }

  return (
    <div className="flex items-center gap-3 relative">
      {/* Save Flow Button */}
      <button
        onClick={handleSaveAnalysis}
        className="hidden md:flex items-center gap-1.5 rounded-lg border border-brass/40 bg-brass/10 px-2.5 py-1 text-xs font-semibold text-brass hover:bg-brass hover:text-primary-foreground transition-all"
        title="Save current evaluation flow"
      >
        <span>{saveSuccess ? "Saved! ✓" : "💾 Save Flow"}</span>
      </button>

      {/* History Drawer Trigger */}
      <button
        onClick={() => setShowDrawer(!showDrawer)}
        className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
      >
        <div className="h-8 w-8 rounded-full border border-brass/40 bg-brass/10 grid place-items-center mono text-xs font-bold text-brass shadow-sm">
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-medium text-ink-text mono truncate max-w-[130px]">
            {label}
          </div>
          <div className="text-[10px] text-brass mono">
            {savedAnalyses.length} saved {savedAnalyses.length === 1 ? "flow" : "flows"}
          </div>
        </div>
      </button>

      {/* Saved Analyses Dropdown Menu */}
      {showDrawer && (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-line bg-panel p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-line/50 pb-2">
            <span className="mono text-[11px] font-bold uppercase tracking-widest text-brass">
              Saved Analyses History
            </span>
            <button
              onClick={() => setShowDrawer(false)}
              className="text-xs text-muted-text hover:text-ink-text font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {savedAnalyses.length === 0 ? (
              <div className="text-xs text-muted-text py-3 text-center italic">
                No saved flows yet. Click "Save Flow" to keep analysis runs.
              </div>
            ) : (
              savedAnalyses.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    rehoxStore.loadAnalysis(item.id);
                    setShowDrawer(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl border transition-colors ${
                    item.id === activeAnalysisId
                      ? "border-brass bg-brass/10 text-brass font-bold"
                      : "border-line/60 bg-ink/60 text-ink-text hover:border-line"
                  }`}
                >
                  <div className="text-xs font-bold truncate">{item.title}</div>
                  <div className="mono text-[10px] text-muted-text mt-0.5">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-line/50 pt-2 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                rehoxStore.createNewAnalysis();
                setShowDrawer(false);
              }}
              className="rounded-lg bg-brass px-3 py-1.5 text-xs font-bold text-primary-foreground hover:brightness-110"
            >
              + New Flow
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500 hover:text-white transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      )}
    </div>
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
          <UserBadge />
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