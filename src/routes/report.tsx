import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useRehox } from "@/lib/rehox/store";
import { generateCareerActionPlan } from "@/lib/rehox/recommendations";
import { CATEGORY_LABEL } from "@/lib/rehox/types";
import { EmptyState } from "./talent-check";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "AI Eligibility & Recommendations Report · RehoX" },
      { name: "description", content: "Executive AI readiness verdict, gap feedback, certifications, and practice problems." },
    ],
  }),
  component: ReportPage,
});

export function ReportPage() {
  const profile = useRehox((s) => s.profile);
  const jd = useRehox((s) => s.jd);
  const talentCheck = useRehox((s) => s.talentCheck);
  const skillMatch = useRehox((s) => s.skillMatch);

  const targetCompany = jd?.company || talentCheck?.company || "Target Tech Company";
  const targetRole = jd?.role || profile?.preferred_roles[0] || "Software Engineer";

  const gaps = talentCheck?.skillset_gap || [];
  const actionPlan = useMemo(
    () => generateCareerActionPlan(gaps, targetCompany),
    [gaps, targetCompany]
  );

  if (!profile) {
    return (
      <EmptyState
        title="No candidate profile built yet."
        body="The AI Eligibility Report analyzes your profile and evaluation results to generate a personalized career action plan."
        ctaTo="/profile"
        ctaLabel="Build candidate profile →"
      />
    );
  }

  const score = talentCheck?.readiness_score ?? skillMatch?.match_score ?? 70;
  const isEligible = score >= 75;
  const verdictText = score >= 80 ? "High Eligibility — Strong Target Fit" : score >= 65 ? "Moderate Eligibility — Nearly Ready" : "Developing Candidate — Action Required";

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-brass font-semibold">Step 06 · AI Career & Eligibility Report</div>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-text">Readiness & Skill Action Plan</h1>
          <p className="mt-1 text-xs text-muted-text">
            Evaluation target: <strong className="text-ink-text font-medium">{targetCompany !== "Unknown" ? `${targetCompany} — ` : ""}{targetRole}</strong>
          </p>
        </div>

        <Link
          to="/resume-builder"
          className="flex items-center gap-2 rounded-xl bg-brass px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow transition-all hover:brightness-110 active:scale-95"
        >
          <span>ATS Resume Builder →</span>
        </Link>
      </div>

      {/* AI Verdict Hero Banner */}
      <div className={`rounded-3xl border p-6 space-y-4 shadow-xl backdrop-blur-md ${
        isEligible
          ? "border-emerald-500/40 bg-gradient-to-br from-panel/90 via-panel/60 to-emerald-500/10"
          : "border-amber-500/40 bg-gradient-to-br from-panel/90 via-panel/60 to-amber-500/10"
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/40 pb-4">
          <div className="space-y-1">
            <span className="mono text-[11px] uppercase tracking-widest text-brass font-bold">
              AI Candidate Verdict
            </span>
            <h2 className="font-display text-2xl font-bold text-ink-text flex items-center gap-2.5">
              <span>{verdictText}</span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-display text-4xl font-extrabold text-brass">{score}%</div>
              <div className="mono text-[10px] uppercase text-muted-text">Readiness Score</div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-text leading-relaxed font-medium">
          {talentCheck?.explanation ||
            `Candidate profile exhibits key competencies for ${targetRole} at ${targetCompany}. Closing remaining category deficits will elevate interview readiness to top tier.`}
        </p>
      </div>

      {/* Recommended Online Certifications */}
      <section className="rounded-2xl border border-line/60 bg-panel/50 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-line/40 pb-3">
          <div>
            <span className="mono text-[10px] uppercase tracking-widest text-brass font-bold">
              Targeted Qualifications
            </span>
            <h2 className="font-display text-lg font-bold text-ink-text">Recommended Online Certifications</h2>
          </div>
          <span className="mono text-[10px] text-muted-text">Gap Category Aligned</span>
        </div>

        <div className="grid gap-3.5 md:grid-cols-2">
          {actionPlan.certifications.map((cert, idx) => (
            <div key={idx} className="rounded-xl border border-line/60 bg-ink/60 p-4 space-y-2 flex flex-col justify-between shadow-sm">
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="mono rounded bg-panel px-2 py-0.5 text-[10px] font-bold text-brass border border-line">
                    {cert.category} · {CATEGORY_LABEL[cert.category]}
                  </span>
                  <span className="mono text-[10px] uppercase text-emerald-400 font-semibold">{cert.level}</span>
                </div>
                <h3 className="text-xs font-bold text-ink-text pt-1">{cert.title}</h3>
                <div className="text-[11px] text-muted-text">Provider: {cert.provider}</div>
                <p className="text-xs text-muted-text/90 italic pt-1 border-t border-line/30">
                  Why it matters: {cert.relevanceReason}
                </p>
              </div>

              <a
                href={cert.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg border border-line bg-panel py-2 text-xs font-semibold text-brass hover:border-brass transition-colors"
              >
                <span>Explore Certification Course ↗</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Company-Specific Practice Problems */}
      <section className="rounded-2xl border border-line/60 bg-panel/50 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-line/40 pb-3">
          <div>
            <span className="mono text-[10px] uppercase tracking-widest text-brass font-bold">
              Interview Preparation
            </span>
            <h2 className="font-display text-lg font-bold text-ink-text">
              Targeted Practice Problems for {targetCompany}
            </h2>
          </div>
          <span className="mono text-[10px] text-muted-text">Handpicked Problems</span>
        </div>

        <div className="space-y-3">
          {actionPlan.practiceProblems.map((prob, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-line/60 bg-ink/60 p-4 hover:border-brass/40 transition-colors shadow-sm"
            >
              <div className="space-y-1 flex-1 min-w-[240px]">
                <div className="flex items-center gap-2">
                  <span className="mono rounded bg-panel px-2 py-0.5 text-[10px] font-bold text-brass border border-line">
                    {prob.category}
                  </span>
                  <h3 className="text-xs font-bold text-ink-text">{prob.title}</h3>
                  <span className={`mono text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                    prob.difficulty === "Easy" ? "text-emerald-400 bg-emerald-500/10" : prob.difficulty === "Medium" ? "text-amber-400 bg-amber-500/10" : "text-rose-400 bg-rose-500/10"
                  }`}>
                    {prob.difficulty}
                  </span>
                </div>
                <p className="text-xs text-muted-text">{prob.description}</p>
              </div>

              <a
                href={prob.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-brass/10 border border-brass/30 px-3.5 py-2 text-xs font-bold text-brass hover:bg-brass hover:text-primary-foreground transition-all"
              >
                <span>Practice on {prob.platform} ↗</span>
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Curated Skill Learning Resources */}
      <section className="rounded-2xl border border-line/60 bg-panel/50 p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-line/40 pb-3">
          <div>
            <span className="mono text-[10px] uppercase tracking-widest text-brass font-bold">
              Self-Paced Learning
            </span>
            <h2 className="font-display text-lg font-bold text-ink-text">Curated Domain Knowledge Resources</h2>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {actionPlan.resources.map((res, idx) => (
            <div key={idx} className="rounded-xl border border-line/60 bg-ink/60 p-4 space-y-2 flex flex-col justify-between">
              <div>
                <span className="mono text-[10px] font-bold text-brass bg-panel px-2 py-0.5 rounded border border-line">
                  {res.type}
                </span>
                <h3 className="text-xs font-bold text-ink-text pt-2">{res.title}</h3>
                <div className="text-[11px] text-muted-text mt-0.5">{res.provider}</div>
              </div>
              <a
                href={res.url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 text-xs text-brass hover:underline mono font-semibold"
              >
                Open Resource ↗
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Navigation Footer */}
      <div className="flex justify-end pt-4">
        <Link
          to="/resume-builder"
          className="flex items-center gap-2.5 rounded-xl bg-brass px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95"
        >
          <span>Continue to ATS Resume Builder →</span>
        </Link>
      </div>
    </div>
  );
}
