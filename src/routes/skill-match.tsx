import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SkillDial } from "@/components/rehox/SkillDial";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import { runSkillMatch } from "@/lib/rehox/compute";
import { CATEGORY_LABEL, type Skill, type SkillMatchResult, type CategoryCode } from "@/lib/rehox/types";
import { EmptyState } from "./talent-check";

function normalizeApiResponse(payload: Record<string, unknown>, jd: { skills: Skill[] }): SkillMatchResult {
  const matched = Array.isArray(payload.matched_skills) ? payload.matched_skills : [];
  const missing = Array.isArray(payload.missing_skills) ? payload.missing_skills : [];
  const skillsByName = new Map(jd.skills.map((skill) => [skill.skill_name.toLowerCase(), skill]));

  const toSkill = (value: unknown): Skill | null => {
    if (typeof value !== "string") return null;
    const source = skillsByName.get(value.toLowerCase());
    if (source) {
      return source;
    }

    return {
      skill_name: value,
      category_code: "OTHER" as CategoryCode,
      evidence: "Matched via AI engine",
      confidence: "medium",
    };
  };

  return {
    jd_source_file: jd.skills.length > 0 ? "ai-match" : "ai-match",
    match_score: typeof payload.match_score === "number" ? payload.match_score : 0,
    matched_skills: matched.map((value) => toSkill(value)).filter((skill): skill is Skill => Boolean(skill)),
    missing_skills: missing.map((value) => toSkill(value)).filter((skill): skill is Skill => Boolean(skill)),
    summary: typeof payload.summary === "string" ? payload.summary : undefined,
    category_scores: Array.isArray(payload.category_scores)
      ? payload.category_scores.filter((entry): entry is { category: string; score: number } => Boolean(entry && typeof entry === "object" && "category" in entry && "score" in entry && typeof entry.score === "number"))
      : [],
  };
}

export const Route = createFileRoute("/skill-match")({
  head: () => ({
    meta: [
      { title: "Skill Match · RehoX" },
      { name: "description", content: "Compare your profile to a specific JD — with a match score and a gap list." },
      { property: "og:title", content: "Skill Match · RehoX" },
      { property: "og:description", content: "See exactly which JD skills you match and which you're missing." },
    ],
  }),
  component: SkillMatchPage,
});

function SkillMatchPage() {
  const profile = useRehox((s) => s.profile);
  const currentJd = useRehox((s) => s.jd);

  const [apiResult, setApiResult] = useState<SkillMatchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const jd = currentJd;
  const fallbackResult = useMemo(() => (profile && jd ? runSkillMatch(profile, jd) : null), [profile, jd]);
  const result = apiResult ?? fallbackResult;

  useEffect(() => {
    let cancelled = false;

    async function loadMatch() {
      if (!profile || !jd) {
        setApiResult(null);
        return;
      }

      setIsLoading(true);

      try {
        const payload = {
          candidate_profile: {
            name: profile.name,
            skills: profile.skills.map((skill) => ({
              skill_name: skill.skill_name,
              category_code: skill.category_code,
              evidence: skill.evidence,
              confidence: skill.confidence,
            })),
          },
          jd: {
            company: jd.company,
            role: jd.role,
            skills: jd.skills.map((skill) => ({
              skill_name: skill.skill_name,
              category_code: skill.category_code,
              evidence: skill.evidence,
              confidence: skill.confidence,
            })),
          },
        };

        const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");
        const response = await fetch(`${apiBaseUrl}/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          const normalized = normalizeApiResponse(data, jd);
          if (!cancelled) {
            setApiResult(normalized);
            rehoxStore.set({ skillMatch: normalized });
          }
        }
      } catch {
        // Fallback to client deterministic match gracefully
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMatch();
    return () => {
      cancelled = true;
    };
  }, [jd, profile]);

  useEffect(() => {
    if (result) {
      rehoxStore.set({ skillMatch: result });
    }
  }, [result]);

  if (!profile) {
    return (
      <EmptyState
        title="No candidate profile built yet."
        body="Skill Match compares your profile skills directly against job description requirements."
        ctaTo="/profile"
        ctaLabel="Build candidate profile →"
      />
    );
  }

  if (!jd) {
    return (
      <EmptyState
        title="No job description uploaded."
        body="Skill Match requires a target Job Description (JD) to calculate match score and gap list."
        ctaTo="/jd"
        ctaLabel="Upload a Job Description →"
      />
    );
  }

  const jdCats = new Set(jd.skills.map((s) => s.category_code));
  const profileCatLevel = new Map<string, number>();
  for (const s of profile.skills) {
    profileCatLevel.set(
      s.category_code,
      Math.max(profileCatLevel.get(s.category_code) ?? 0, s.confidence === "high" ? 8 : s.confidence === "medium" ? 6 : 4)
    );
  }
  const dialData = Array.from(jdCats).map((c) => ({
    code: c,
    required: 8,
    candidate: profileCatLevel.get(c) ?? 0,
  }));
  const r = result!;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-brass font-semibold">Skill Match Analysis</div>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-text">Job Match Assessment</h1>
          <p className="mt-1 text-xs text-muted-text">
            Target Job: <strong className="text-ink-text font-medium">{jd.company !== "Unknown" ? `${jd.company} — ` : ""}{jd.role}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="mono text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
            ⚡ AI Engine Active
          </span>
          <Link
            to="/jd"
            className="text-xs text-brass hover:underline mono font-semibold"
          >
            Change JD →
          </Link>
        </div>
      </div>

      {/* Hero Metrics & Dial */}
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr),340px]">
        <div className="rounded-3xl border border-line/60 bg-panel/50 p-6 flex justify-center items-center shadow-sm">
          <SkillDial data={dialData} size={380} compact />
        </div>

        <div className="rounded-3xl border border-brass/40 bg-gradient-to-br from-panel/90 via-panel/60 to-brass/10 p-6 space-y-6 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="mono text-[11px] uppercase tracking-widest text-brass font-semibold">
              Skill Match Index
            </div>
            <div className="mt-2 font-display text-6xl font-extrabold text-brass">
              {r.match_score}%
            </div>
            <div className="mt-1.5 text-xs text-muted-text">
              Match score against {jd.role}
            </div>

            {r.summary && (
              <div className="mt-4 rounded-xl border border-line/60 bg-ink/60 p-3.5 text-xs text-muted-text leading-relaxed">
                {r.summary}
              </div>
            )}
          </div>

          <div className="border-t border-line/40 pt-4 grid grid-cols-2 gap-4 text-center">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
              <div className="mono text-[10px] uppercase tracking-widest text-emerald-400 font-bold">Matched</div>
              <div className="mt-1 font-display text-2xl font-bold text-emerald-400">{r.matched_skills.length}</div>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="mono text-[10px] uppercase tracking-widest text-amber-400 font-bold">Missing</div>
              <div className="mt-1 font-display text-2xl font-bold text-amber-400">{r.missing_skills.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Scores Bar Chart */}
      {r.category_scores && r.category_scores.length > 0 && (
        <section className="rounded-2xl border border-line/60 bg-panel/50 p-6 space-y-4 shadow-sm">
          <h2 className="font-display text-lg font-bold text-ink-text">Category Skill Match Breakdown</h2>
          <div className="grid gap-3.5 md:grid-cols-2">
            {r.category_scores.map((entry) => (
              <div key={entry.category} className="rounded-xl border border-line/60 bg-ink/50 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink-text">{entry.category}</span>
                  <span className="mono font-bold text-brass">{entry.score}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-panel/80 overflow-hidden">
                  <div className="h-2 rounded-full bg-brass transition-all duration-500" style={{ width: `${Math.min(100, entry.score)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Missing Skills Cards */}
      <section className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h2 className="font-display text-lg font-bold text-ink-text">Missing Skill Requirements ({r.missing_skills.length})</h2>
          </div>
        </div>

        {r.missing_skills.length === 0 ? (
          <div className="text-xs text-emerald-400 font-medium">All skill requirements met! Candidate covers all required competencies.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {r.missing_skills.map((s, i) => (
              <div key={i} className="rounded-xl border border-line/60 bg-panel/70 p-4 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono rounded-lg bg-ink px-2 py-0.5 text-[10px] font-bold text-brass border border-line">
                    {s.category_code}
                  </span>
                  <span className="text-sm font-bold text-ink-text">{s.skill_name}</span>
                  <span className="mono text-[10px] uppercase text-muted-text/80">{CATEGORY_LABEL[s.category_code]}</span>
                </div>
                {s.evidence && (
                  <div className="text-xs italic text-muted-text/90 pt-1 border-t border-line/30">
                    JD Evidence: "{s.evidence}"
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Matched Skills Cards */}
      <section className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <h2 className="font-display text-lg font-bold text-ink-text">Matched Skills ({r.matched_skills.length})</h2>
        </div>

        <div className="grid gap-2.5 md:grid-cols-3">
          {r.matched_skills.map((s, i) => (
            <div key={i} className="flex items-center gap-2.5 rounded-xl border border-line/60 bg-panel/70 px-3.5 py-2.5 text-xs shadow-sm">
              <span className="mono rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                {s.category_code}
              </span>
              <span className="font-semibold text-ink-text truncate">{s.skill_name}</span>
            </div>
          ))}
          {r.matched_skills.length === 0 && <div className="text-xs text-muted-text">No matches found yet.</div>}
        </div>
      </section>
    </div>
  );
}