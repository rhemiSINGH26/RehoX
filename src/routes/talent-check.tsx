import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { SkillDial } from "@/components/rehox/SkillDial";
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

function TalentCheckPage() {
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
        ctaLabel="Build your profile →"
      />
    );
  }

  const targetTitle = jd ? `${jd.company} — ${jd.role}` : profile.preferred_roles[0] || "Target Software Engineer Role";

  const dialData =
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

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-brass font-semibold">Talent Readiness Check</div>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-text">Competency Radar</h1>
          <p className="mt-1 text-xs text-muted-text">
            Evaluation for <strong className="text-ink-text font-medium">{targetTitle}</strong>
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
          {/* Main Dial & Score Layout */}
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr),340px]">
            {/* Radar Dial View */}
            <div className="rounded-3xl border border-line/60 bg-panel/50 p-6 flex items-center justify-center shadow-sm">
              <SkillDial data={dialData} size={440} />
            </div>

            {/* Score & Readiness Card */}
            <div className="rounded-3xl border border-brass/40 bg-gradient-to-br from-panel/90 via-panel/60 to-brass/10 p-6 space-y-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
              <div>
                <div className="mono text-[11px] uppercase tracking-widest text-brass font-semibold">
                  Readiness Score
                </div>
                <div className="mt-2 font-display text-6xl font-extrabold text-ink-text">
                  {result.readiness_score}
                  <span className="text-2xl font-normal text-muted-text">/100</span>
                </div>
                <div className="mt-2 inline-flex items-center rounded-lg bg-brass/20 px-3 py-1 text-xs font-bold text-brass border border-brass/30">
                  ⚡ {result.readiness_band ?? readinessLabel(result.readiness_score)}
                </div>
              </div>

              <div className="border-t border-line/40 pt-4 space-y-2 text-xs">
                <div className="flex justify-between text-muted-text">
                  <span>Target Role:</span>
                  <span className="text-ink-text font-medium truncate max-w-[160px]">{jd?.role || "Software Engineer"}</span>
                </div>
                <div className="flex justify-between text-muted-text">
                  <span>Skill Gaps:</span>
                  <span className={gapCount > 0 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                    {gapCount === 0 ? "All requirements met! 🎉" : `${gapCount} gap${gapCount === 1 ? "" : "s"} identified`}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Explanation Banner */}
          {result.explanation && (
            <div className="rounded-2xl border border-line/60 bg-panel/50 p-5 space-y-1.5 shadow-sm">
              <div className="mono text-[10px] uppercase tracking-widest text-brass font-semibold">
                RADIX Evaluation Summary
              </div>
              <p className="text-xs text-muted-text leading-relaxed">{result.explanation}</p>
            </div>
          )}

          {/* Top Priorities Card */}
          {result.top_priorities && result.top_priorities.length > 0 && (
            <div className="rounded-2xl border border-line/60 bg-panel/50 p-5 space-y-3 shadow-sm">
              <div className="mono text-[10px] uppercase tracking-widest text-brass font-semibold">
                Priority Skill Target Areas
              </div>
              <div className="grid gap-2.5 md:grid-cols-3">
                {result.top_priorities.map((priority) => (
                  <div
                    key={priority.category_code}
                    className="flex items-center justify-between rounded-xl border border-line/60 bg-ink/50 p-3.5"
                  >
                    <div className="space-y-0.5">
                      <div className="mono text-[10px] font-bold text-brass">{priority.category_code}</div>
                      <div className="text-xs font-semibold text-ink-text">{CATEGORY_LABEL[priority.category_code]}</div>
                    </div>
                    <span className="mono text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {priority.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 12-Skillset Breakdown Table */}
          <div className="rounded-2xl border border-line/60 bg-panel/50 overflow-hidden shadow-sm">
            <div className="grid grid-cols-[90px,1fr,80px,80px,90px] gap-3 border-b border-line/60 px-5 py-3 mono text-[10px] uppercase tracking-widest text-muted-text font-bold">
              <div>Category</div>
              <div>Skill Domain</div>
              <div>Required</div>
              <div>Candidate</div>
              <div>Status</div>
            </div>
            {sortedGap.map((row) => (
              <div
                key={row.category_code}
                className="grid grid-cols-[90px,1fr,80px,80px,90px] items-center gap-3 border-t border-line/40 px-5 py-3 text-xs hover:bg-ink/30 transition-colors"
              >
                <span className="mono font-bold text-brass">{row.category_code}</span>
                <span className="font-semibold text-ink-text">{CATEGORY_LABEL[row.category_code]}</span>
                <span className="mono text-muted-text font-medium">{row.required_level}/10</span>
                <span className="mono font-bold text-ink-text">{row.candidate_level}/10</span>
                {row.gap ? (
                  <span className="inline-flex items-center gap-1.5 text-amber-400 font-semibold mono text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Gap
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold mono text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Met
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <Link
              to="/skill-match"
              className="flex items-center gap-2 rounded-xl bg-brass px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95"
            >
              <span>Continue to Skill Match →</span>
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
