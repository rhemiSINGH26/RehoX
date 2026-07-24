import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { RADIXRadarChart } from "@/components/rehox/RADIXRadarChart";
import { ReadinessGaugeRing } from "@/components/rehox/ReadinessGaugeRing";
import { readinessLabel, runTalentCheck } from "@/lib/rehox/compute";
import { useRehox } from "@/lib/rehox/store";
import { CATEGORY_LABEL } from "@/lib/rehox/types";

export const Route = createFileRoute("/talent-check")({
  head: () => ({
    meta: [
      { title: "Talent Check · RehoX" },
      { name: "description", content: "Evaluate candidate readiness across the full 12-skillset RADIX framework." },
      { property: "og:title", content: "Talent Check · RehoX" },
      { property: "og:description", content: "Radar dial showing required competency levels vs candidate skill signals." },
    ],
  }),
  component: TalentCheckPage,
});

export function TalentCheckPage() {
  const profile = useRehox((s) => s.profile);
  const jd = useRehox((s) => s.jd);

  // Compute Talent Check result deterministically from profile & JD
  const result = useMemo(() => {
    if (!profile) return null;
    return runTalentCheck(
      { competency_levels: profile.competency_levels, skills: profile.skills },
      jd?.company
    );
  }, [profile, jd]);

  if (!profile) {
    return (
      <EmptyState
        title="No candidate profile built yet."
        body="Talent Check compares candidate competencies against the full 12-skillset RADIX framework."
        ctaTo="/profile"
        ctaLabel="Build candidate profile →"
      />
    );
  }

  const targetTitle = jd ? `${jd.company !== "Unknown" ? jd.company + " — " : ""}${jd.role}` : profile.preferred_roles[0] || "Target Software Engineer Role";

  const radarData =
    result?.skillset_gap.map((row) => ({
      code: row.category_code,
      required: row.required_level,
      candidate: row.candidate_level,
    })) ?? [];

  const sortedGap = result
    ? [...result.skillset_gap].sort(
        (a, b) =>
          Number(b.gap) - Number(a.gap) ||
          (b.required_level - b.candidate_level) - (a.required_level - a.candidate_level),
      )
    : [];

  const gapCount = result?.skillset_gap.filter((row) => row.gap).length ?? 0;
  const metCount = (result?.skillset_gap.length ?? 12) - gapCount;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-brass font-semibold">Talent Readiness Visualization</div>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-text">Competency Radar Check</h1>
          <p className="mt-1 text-xs text-muted-text">
            Evaluation target: <strong className="text-ink-text font-medium">{targetTitle}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/skill-match"
            className="flex items-center gap-2 rounded-xl bg-brass px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow transition-all hover:brightness-110 active:scale-95"
          >
            <span>Continue to Skill Match →</span>
          </Link>
        </div>
      </div>

      {result && (
        <>
          {/* Executive Radar & Gauge Hero Card */}
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr),320px] items-stretch">
            {/* Left: 12-Axis Radar Chart */}
            <div className="rounded-3xl border border-line/60 bg-panel/60 p-6 flex flex-col items-center justify-center shadow-xl backdrop-blur-md">
              <div className="w-full flex items-center justify-between border-b border-line/40 pb-3 mb-4">
                <div className="mono text-[11px] uppercase tracking-widest text-brass font-bold">
                  RADIX 12-Skillset Spider Radar
                </div>
                <span className="mono text-[11px] text-muted-text">{metCount}/12 Requirements Met</span>
              </div>
              <RADIXRadarChart data={radarData} size={420} showLegend={true} />
            </div>

            {/* Right: Readiness Score Gauge Ring */}
            <div className="rounded-3xl border border-brass/40 bg-gradient-to-br from-panel/90 via-panel/60 to-brass/10 p-6 shadow-2xl backdrop-blur-md flex flex-col justify-between items-center text-center space-y-6">
              <div className="w-full border-b border-line/40 pb-3 text-left">
                <div className="mono text-[11px] uppercase tracking-widest text-brass font-bold">
                  Readiness Score
                </div>
              </div>

              <ReadinessGaugeRing
                score={result.readiness_score}
                size={210}
                label="Readiness Index"
                sublabel="RADIX Benchmark Score"
              />

              <div className="w-full space-y-3 pt-2">
                <div className="inline-flex items-center gap-2 rounded-xl bg-brass/20 px-4 py-2 text-xs font-bold text-brass border border-brass/40 shadow-sm w-full justify-center">
                  ⚡ {result.readiness_band ?? readinessLabel(result.readiness_score)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                    <div className="mono text-[10px] uppercase font-bold text-emerald-400">Met Skills</div>
                    <div className="font-display text-lg font-bold text-emerald-400">{metCount}</div>
                  </div>
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5">
                    <div className="mono text-[10px] uppercase font-bold text-amber-400">Gaps</div>
                    <div className="font-display text-lg font-bold text-amber-400">{gapCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Explanation Banner */}
          {result.explanation && (
            <div className="rounded-2xl border border-line/60 bg-panel/60 p-5 space-y-1.5 shadow-sm">
              <div className="mono text-[10px] uppercase tracking-widest text-brass font-bold flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brass animate-pulse" />
                RADIX Evaluation Summary
              </div>
              <p className="text-xs text-muted-text leading-relaxed font-medium">{result.explanation}</p>
            </div>
          )}

          {/* Top Priorities Focus Card */}
          {result.top_priorities && result.top_priorities.length > 0 && (
            <div className="rounded-2xl border border-line/60 bg-panel/60 p-6 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-line/40 pb-3">
                <div className="mono text-[11px] uppercase tracking-widest text-brass font-bold">
                  Top Priority Skill Focus Areas
                </div>
                <span className="mono text-[10px] text-amber-400 font-semibold uppercase">High Leverage Gaps</span>
              </div>
              <div className="grid gap-3.5 md:grid-cols-3">
                {result.top_priorities.map((priority) => (
                  <div
                    key={priority.category_code}
                    className="flex items-center justify-between rounded-xl border border-line/60 bg-ink/60 p-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <span className="mono text-[11px] font-bold text-brass">{priority.category_code}</span>
                      <div className="text-xs font-bold text-ink-text">{CATEGORY_LABEL[priority.category_code]}</div>
                    </div>
                    <span className="mono text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/30">
                      {priority.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12-Skillset Grid Cards Visualization */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-display text-xl font-bold text-ink-text">12-Category Skillset Competency Matrix</h2>
              <span className="mono text-xs text-muted-text font-medium">RADIX Competency Levels (1-10)</span>
            </div>

            <div className="grid gap-3.5 md:grid-cols-3">
              {result.skillset_gap.map((row) => {
                const isMet = !row.gap;
                const percent = Math.min(100, Math.round((row.candidate_level / Math.max(1, row.required_level)) * 100));

                return (
                  <div
                    key={row.category_code}
                    className="rounded-2xl border border-line/60 bg-panel/50 p-4 space-y-3 shadow-sm hover:border-brass/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="mono text-[11px] font-bold text-brass rounded bg-ink px-2 py-0.5 border border-line">
                          {row.category_code}
                        </span>
                        <span className="text-xs font-bold text-ink-text">{CATEGORY_LABEL[row.category_code]}</span>
                      </div>
                      <span
                        className={[
                          "mono text-[10px] px-2 py-0.5 rounded-md font-bold uppercase",
                          isMet
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/30",
                        ].join(" ")}
                      >
                        {isMet ? "Met" : "Gap"}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] mono">
                        <span className="text-muted-text">Cand: <strong className="text-ink-text">{row.candidate_level}</strong></span>
                        <span className="text-muted-text">Req: <strong className="text-brass">{row.required_level}</strong></span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-ink overflow-hidden border border-line/40">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${isMet ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Link
              to="/skill-match"
              className="flex items-center gap-2.5 rounded-xl bg-brass px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95"
            >
              <span>Continue to Skill Match</span>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  ctaTo,
  ctaLabel,
}: {
  title: string;
  body: string;
  ctaTo: "/profile" | "/jd" | "/resume";
  ctaLabel: string;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-line/60 bg-panel/50 p-10 text-center shadow-xl">
      <h2 className="font-display text-2xl font-bold text-ink-text">{title}</h2>
      <p className="mt-2 text-sm text-muted-text leading-relaxed">{body}</p>
      <Link
        to={ctaTo}
        className="mt-6 inline-block rounded-xl bg-brass px-6 py-3 text-sm font-bold text-primary-foreground shadow transition-all hover:brightness-110"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
