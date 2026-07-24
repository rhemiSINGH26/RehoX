import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ReadinessGaugeRing } from "@/components/rehox/ReadinessGaugeRing";
import { enhanceBulletWithAi, evaluateAtsResume } from "@/lib/rehox/ats-engine";
import { useRehox } from "@/lib/rehox/store";
import { saveAtsResumeToSupabase } from "@/lib/rehox/supabase";
import type { ATSResume } from "@/lib/rehox/types";

export const Route = createFileRoute("/resume-builder")({
  head: () => ({
    meta: [
      { title: "ATS Resume Builder & Feedback Engine · RehoX" },
      {
        name: "description",
        content: "Build, score, and optimize your resume for ATS systems with live AI feedback.",
      },
    ],
  }),
  component: ResumeBuilderPage,
});

export function ResumeBuilderPage() {
  const profile = useRehox((s) => s.profile);
  const jd = useRehox((s) => s.jd);
  const resumeSource = useRehox((s) => s.resume);

  // Initialize ATS Resume state from candidate profile or parsed resume
  const [resume, setResume] = useState<ATSResume>(() => ({
    id: `ats-${Date.now()}`,
    title: `${profile?.name || "Candidate"}'s ATS Resume`,
    candidate_name: profile?.name || resumeSource?.name || "Candidate Name",
    email: profile?.email || resumeSource?.email || "candidate@email.com",
    phone: "+1 (555) 019-2834",
    summary:
      resumeSource?.experience?.[0] ||
      `Results-driven Software Engineer specializing in ${
        profile?.skills
          .slice(0, 3)
          .map((s) => s.skill_name)
          .join(", ") || "full-stack development and distributed systems"
      }. Proven track record of architecting scalable applications.`,
    skills: profile?.skills.map((s) => s.skill_name) || [
      "TypeScript",
      "React",
      "Node.js",
      "Python",
      "System Design",
      "AWS",
      "Docker",
      "PostgreSQL",
    ],
    experience: [
      {
        company:
          jd?.company && jd.company !== "Unknown"
            ? `${jd.company} Target Labs`
            : "Tech Innovations Inc.",
        role: jd?.role || "Software Engineer",
        dates: "2023 – Present",
        bullets: [
          `Architected high-throughput microservices reducing API latency by 35%.`,
          `Engineered production CI/CD automation pipelines handling 50k daily active requests.`,
          `Optimized SQL database query performance yielding a 40% reduction in database execution times.`,
        ],
      },
    ],
    education: [
      {
        institution:
          profile?.education ||
          resumeSource?.education ||
          "Bachelor of Science in Computer Science",
        degree: "B.S. Computer Science",
        year: "2023",
        gpa: profile?.cgpa || "3.8/4.0",
      },
    ],
  }));

  // Auto-sync ATS Resume updates to Supabase
  useEffect(() => {
    if (resume) {
      saveAtsResumeToSupabase(resume).catch(() => {});
    }
  }, [resume]);

  const [optimizingIndex, setOptimizingIndex] = useState<number | null>(null);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [recalcCounter, setRecalcCounter] = useState(0);
  const [recalcFlash, setRecalcFlash] = useState(false);

  // Calculate live ATS diagnostics
  const atsResult = useMemo(
    () => evaluateAtsResume(resume, jd),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resume, jd, recalcCounter],
  );

  function handleRecalculateScore() {
    setRecalcCounter((prev) => prev + 1);
    setRecalcFlash(true);
    setTimeout(() => setRecalcFlash(false), 2500);
  }

  async function handleEnhanceBullet(expIdx: number, bulletIdx: number) {
    const original = resume.experience[expIdx].bullets[bulletIdx];
    setOptimizingIndex(expIdx * 100 + bulletIdx);

    try {
      const enhanced = await enhanceBulletWithAi(original, resume.experience[expIdx].role);
      setResume((prev) => {
        const updatedExp = [...prev.experience];
        const updatedBullets = [...updatedExp[expIdx].bullets];
        updatedBullets[bulletIdx] = enhanced;
        updatedExp[expIdx] = { ...updatedExp[expIdx], bullets: updatedBullets };
        return { ...prev, experience: updatedExp };
      });
    } finally {
      setOptimizingIndex(null);
    }
  }

  function handleAddSkill() {
    if (!newSkillInput.trim()) return;
    setResume((prev) => ({
      ...prev,
      skills: Array.from(new Set([...prev.skills, newSkillInput.trim()])),
    }));
    setNewSkillInput("");
  }

  function handleRemoveSkill(skillToRemove: string) {
    setResume((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Printable PDF Resume view (Active only during browser print to PDF) */}
      <div className="hidden print:block text-slate-900 bg-white p-8 max-w-4xl mx-auto space-y-6 printable-resume">
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <h1 className="text-3xl font-bold uppercase tracking-wide">{resume.candidate_name}</h1>
          <p className="text-sm font-semibold text-slate-700">
            {resume.email} • {resume.phone}
          </p>
        </div>

        {resume.summary && (
          <div className="space-y-1">
            <h2 className="text-base font-bold uppercase tracking-wider border-b border-slate-300 pb-1">
              Professional Summary
            </h2>
            <p className="text-xs text-slate-800 leading-relaxed font-serif">{resume.summary}</p>
          </div>
        )}

        {resume.skills.length > 0 && (
          <div className="space-y-1">
            <h2 className="text-base font-bold uppercase tracking-wider border-b border-slate-300 pb-1">
              Technical Skills & Competencies
            </h2>
            <p className="text-xs text-slate-800 font-serif leading-relaxed">
              {resume.skills.join(" • ")}
            </p>
          </div>
        )}

        {resume.experience.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold uppercase tracking-wider border-b border-slate-300 pb-1">
              Work Experience
            </h2>
            {resume.experience.map((exp, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-baseline font-bold text-xs">
                  <span>
                    {exp.role} — <span className="font-semibold text-slate-700">{exp.company}</span>
                  </span>
                  <span className="text-slate-600 font-normal">{exp.dates || "Present"}</span>
                </div>
                <ul className="list-disc list-inside text-xs text-slate-800 space-y-1 pl-1 font-serif">
                  {exp.bullets.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {resume.education.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-base font-bold uppercase tracking-wider border-b border-slate-300 pb-1">
              Education
            </h2>
            {resume.education.map((edu, i) => (
              <div key={i} className="flex justify-between items-baseline text-xs font-serif">
                <span>
                  <strong>{edu.institution}</strong> — {edu.degree}
                </span>
                <span className="text-slate-600 font-semibold">{edu.year}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screen Interactive Workspace (Hidden during print) */}
      <div className="print:hidden space-y-8">
        {/* Top Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
          <div>
            <div className="mono text-xs uppercase tracking-widest text-brass font-semibold">
              Step 07 · ATS Resume Engine
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold text-ink-text">
              ATS Resume Builder & Feedback
            </h1>
            <p className="mt-1 text-xs text-muted-text">
              Build ATS-formatted resumes with live score evaluation and AI bullet optimization.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRecalculateScore}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-bold transition-all shadow active:scale-95 ${
                recalcFlash
                  ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                  : "border-brass/40 bg-brass/10 text-brass hover:bg-brass hover:text-primary-foreground"
              }`}
            >
              <span>{recalcFlash ? "✓ Score Recalculated!" : "🔄 Recalculate Score"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 rounded-xl bg-brass px-5 py-2.5 text-xs font-bold text-primary-foreground shadow transition-all hover:brightness-110 active:scale-95"
            >
              <span>Print / Save as PDF 🖨️</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Live Diagnostics & Builder */}
        <div className="grid gap-8 lg:grid-cols-[340px,minmax(0,1fr)] items-start">
          {/* Left Column: ATS Score & Feedback Diagnostic Panel */}
          <div className="space-y-6 sticky top-20">
            <div className="rounded-3xl border border-brass/40 bg-gradient-to-br from-panel/90 via-panel/60 to-brass/10 p-6 flex flex-col items-center justify-center text-center shadow-xl backdrop-blur-md space-y-4">
              <ReadinessGaugeRing
                score={atsResult.overall_score}
                size={200}
                label="ATS Score"
                sublabel="Resume Compatibility"
              />

              <div className="inline-flex items-center gap-2 rounded-xl bg-brass/20 px-4 py-1.5 text-xs font-bold text-brass border border-brass/30">
                ⚡ {atsResult.verdict}
              </div>
            </div>

            {/* Breakdown Score Cards */}
            <div className="rounded-2xl border border-line/60 bg-panel/50 p-5 space-y-3 shadow-sm">
              <h3 className="mono text-[11px] uppercase tracking-widest text-brass font-bold">
                ATS Diagnostics Breakdown
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-text font-medium">Keyword Match Ratio:</span>
                  <span className="mono font-bold text-brass">
                    {atsResult.keyword_match_score}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-ink overflow-hidden border border-line/40">
                  <div
                    className="h-2 rounded-full bg-brass"
                    style={{ width: `${atsResult.keyword_match_score}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-text font-medium">Formatting & Readability:</span>
                  <span className="mono font-bold text-emerald-400">
                    {atsResult.formatting_score}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-ink overflow-hidden border border-line/40">
                  <div
                    className="h-2 rounded-full bg-emerald-500"
                    style={{ width: `${atsResult.formatting_score}%` }}
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-muted-text font-medium">Action Verbs & Impact:</span>
                  <span className="mono font-bold text-amber-400">
                    {atsResult.impact_action_score}%
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-ink overflow-hidden border border-line/40">
                  <div
                    className="h-2 rounded-full bg-amber-500"
                    style={{ width: `${atsResult.impact_action_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Missing Keywords Feedback Card */}
            {atsResult.missing_keywords.length > 0 && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-3 shadow-sm">
                <div className="mono text-[10px] uppercase tracking-widest text-amber-400 font-bold flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Missing JD Keywords
                </div>
                <p className="text-[11px] text-muted-text">
                  Include these key terms to boost ATS match:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {atsResult.missing_keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="mono text-[10px] rounded-lg bg-ink px-2 py-0.5 text-amber-400 border border-amber-500/20"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Editable Resume Builder Canvas */}
          <div className="rounded-3xl border border-line/60 bg-panel/60 p-8 space-y-6 shadow-xl backdrop-blur-md">
            {/* Header Info */}
            <div className="border-b border-line/40 pb-6 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[11px] mono uppercase text-muted-text font-bold mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={resume.candidate_name}
                    onChange={(e) => setResume({ ...resume, candidate_name: e.target.value })}
                    className="w-full rounded-xl border border-line bg-ink px-3.5 py-2 text-sm font-bold text-ink-text focus:border-brass focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] mono uppercase text-muted-text font-bold mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resume.email}
                    onChange={(e) => setResume({ ...resume, email: e.target.value })}
                    className="w-full rounded-xl border border-line bg-ink px-3.5 py-2 text-sm font-semibold text-ink-text focus:border-brass focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] mono uppercase text-muted-text font-bold mb-1">
                  Professional Summary
                </label>
                <textarea
                  rows={3}
                  value={resume.summary}
                  onChange={(e) => setResume({ ...resume, summary: e.target.value })}
                  className="w-full rounded-xl border border-line bg-ink p-3 text-xs text-ink-text leading-relaxed focus:border-brass focus:outline-none"
                />
              </div>
            </div>

            {/* Technical Skills Section */}
            <div className="border-b border-line/40 pb-6 space-y-3">
              <label className="block text-[11px] mono uppercase text-brass font-bold">
                Technical Skills & Competencies
              </label>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-line/60 bg-ink px-3 py-1 text-xs font-semibold text-ink-text"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-muted-text hover:text-rose-400 font-bold ml-1"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add skill (e.g. Kubernetes, Redis)..."
                  className="flex-1 rounded-xl border border-line bg-ink px-3.5 py-2 text-xs text-ink-text focus:border-brass focus:outline-none"
                />
                <button
                  onClick={handleAddSkill}
                  className="rounded-xl bg-brass px-4 py-2 text-xs font-bold text-primary-foreground hover:brightness-110"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Experience Section with AI Bullet Enhancer */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-line/40 pb-2">
                <label className="block text-[11px] mono uppercase text-brass font-bold">
                  Work Experience & Impact
                </label>
                <span className="mono text-[10px] text-muted-text">
                  ⚡ AI Bullet Enhancer Enabled
                </span>
              </div>

              {resume.experience.map((exp, expIdx) => (
                <div
                  key={expIdx}
                  className="rounded-2xl border border-line/60 bg-ink/40 p-5 space-y-4 shadow-sm"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="block text-[10px] mono text-muted-text mb-1">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[expIdx].company = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className="w-full rounded-xl border border-line bg-ink px-3 py-1.5 text-xs font-bold text-ink-text"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] mono text-muted-text mb-1">
                        Role Title
                      </label>
                      <input
                        type="text"
                        value={exp.role}
                        onChange={(e) => {
                          const updated = [...resume.experience];
                          updated[expIdx].role = e.target.value;
                          setResume({ ...resume, experience: updated });
                        }}
                        className="w-full rounded-xl border border-line bg-ink px-3 py-1.5 text-xs font-bold text-ink-text"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-[10px] mono text-muted-text">
                      Achievement Bullet Points
                    </label>
                    {exp.bullets.map((bullet, bulletIdx) => {
                      const isOptimizing = optimizingIndex === expIdx * 100 + bulletIdx;
                      return (
                        <div key={bulletIdx} className="flex gap-2 items-start">
                          <textarea
                            rows={2}
                            value={bullet}
                            onChange={(e) => {
                              const updatedExp = [...resume.experience];
                              const updatedBullets = [...updatedExp[expIdx].bullets];
                              updatedBullets[bulletIdx] = e.target.value;
                              updatedExp[expIdx].bullets = updatedBullets;
                              setResume({ ...resume, experience: updatedExp });
                            }}
                            className="flex-1 rounded-xl border border-line bg-ink p-2.5 text-xs text-ink-text leading-relaxed focus:border-brass focus:outline-none"
                          />
                          <button
                            onClick={() => handleEnhanceBullet(expIdx, bulletIdx)}
                            disabled={isOptimizing}
                            className="rounded-xl border border-brass/40 bg-brass/10 px-3 py-2 text-[11px] font-bold text-brass hover:bg-brass hover:text-primary-foreground transition-all shrink-0"
                            title="Rewrite bullet with AI using STAR action verbs and metric numbers"
                          >
                            {isOptimizing ? "Optimizing..." : "⚡ Enhance with AI"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
