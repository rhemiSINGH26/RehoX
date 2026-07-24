import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DropZone } from "@/components/rehox/DropZone";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import { fileToText } from "@/lib/rehox/file-to-text";
import { extractJdSkills } from "@/lib/rehox/jd-extract";
import { CATEGORY_LABEL, type CategoryCode, type Skill } from "@/lib/rehox/types";

export const Route = createFileRoute("/jd")({
  head: () => ({
    meta: [
      { title: "JD Analytics · RehoX" },
      { name: "description", content: "Upload a job description document (PDF or DOCX) to extract required skills and competencies." },
      { property: "og:title", content: "JD Analytics · RehoX" },
      { property: "og:description", content: "Extract structured skill lists, evidence, and confidence ratings from any job description." },
    ],
  }),
  component: JDPage,
});

const categoryColors: Record<CategoryCode, { bg: string; text: string; border: string }> = {
  COD: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  DSA: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
  OOD: { bg: "bg-indigo-500/10", text: "text-indigo-400", border: "border-indigo-500/30" },
  APTI: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/30" },
  COMM: { bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/30" },
  AI: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  CLOUD: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/30" },
  SQL: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  SWE: { bg: "bg-teal-500/10", text: "text-teal-400", border: "border-teal-500/30" },
  SYSD: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/30" },
  NETW: { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/30" },
  OS: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" },
  OTHER: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" },
};

const confidenceStyles: Record<Skill["confidence"], { bg: string; text: string; dot: string }> = {
  high: { bg: "bg-emerald-500/10 border border-emerald-500/30", text: "text-emerald-400", dot: "bg-emerald-400" },
  medium: { bg: "bg-amber-500/10 border border-amber-500/30", text: "text-amber-400", dot: "bg-amber-400" },
  low: { bg: "bg-slate-500/10 border border-slate-500/30", text: "text-slate-400", dot: "bg-slate-400" },
};

export function JDPage() {
  const jd = useRehox((s) => s.jd);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  async function handleFile(f: File) {
    setError(null);
    setLoading(true);
    try {
      const text = await fileToText(f);
      const result = await extractJdSkills({ data: { text, fileName: f.name } });
      rehoxStore.set({ jd: result });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    rehoxStore.set({ jd: null });
    setError(null);
  }

  const highConfidenceCount = jd?.skills.filter((s) => s.confidence === "high").length || 0;
  const categoriesPresent = Array.from(new Set(jd?.skills.map((s) => s.category_code) || []));

  // VIEW 1: LOADING STATE
  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-3xl border border-line/60 bg-panel/80 p-10 text-ink-text shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4 border-b border-line/40 pb-6">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-brass border-t-transparent" />
            <div>
              <h3 className="font-display text-xl font-bold">Analyzing Job Description</h3>
              <p className="text-sm text-muted-text">Parsing document, extracting target role & mapping skill signals…</p>
            </div>
          </div>
          <div className="mt-8 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-line/40 bg-ink/40 p-4">
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-line/60" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-line/40" />
                </div>
                <div className="h-6 w-20 animate-pulse rounded-full bg-line/60" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: FULL-PAGE OUTPUT VIEW (When JD is parsed)
  if (jd) {
    return (
      <div className="mx-auto max-w-5xl space-y-8 py-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Top Header & Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line/40 pb-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-ink-text md:text-3xl">
              JD Analytics Results
            </h1>
            <p className="text-xs text-muted-text">Structured skill signal breakdown and category mappings</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 rounded-xl border border-line/60 bg-panel/60 px-4 py-2 text-xs font-semibold text-ink-text transition-all hover:bg-panel hover:border-brass/50 active:scale-95"
            >
              <svg className="h-3.5 w-3.5 text-brass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Upload Another JD</span>
            </button>

            <button
              onClick={() => nav({ to: "/resume" })}
              className="flex items-center gap-2 rounded-xl bg-brass px-5 py-2 text-xs font-semibold text-primary-foreground shadow-md transition-all hover:brightness-110 active:scale-95"
            >
              <span>Continue to Resume Parsing</span>
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Hero Role & Company Banner Card */}
        <div className="rounded-3xl border border-brass/40 bg-gradient-to-br from-panel/90 via-panel/60 to-brass/10 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-2">
              <div className="mono text-[11px] uppercase tracking-widest text-brass font-semibold">
                Target Role & Organization
              </div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight text-ink-text md:text-4xl">
                {jd.role && jd.role !== "Unknown" ? jd.role : "Extracted Role"}
              </h2>
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {jd.company && jd.company !== "Unknown" && (
                  <span className="inline-flex items-center rounded-lg bg-brass/20 px-3.5 py-1 text-xs font-semibold text-brass border border-brass/30">
                    🏢 {jd.company}
                  </span>
                )}
                <span className="inline-flex items-center rounded-lg bg-ink/80 border border-line/60 px-3.5 py-1 mono text-[11px] text-muted-text">
                  📄 {jd.source_file}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Bar */}
          <div className="mt-8 grid grid-cols-3 gap-4 border-t border-line/40 pt-6 text-center">
            <div className="rounded-2xl border border-line/40 bg-ink/50 p-4">
              <div className="font-display text-3xl font-bold text-ink-text">{jd.skills.length}</div>
              <div className="mono text-[11px] uppercase tracking-wider text-muted-text mt-1">Skills Extracted</div>
            </div>
            <div className="rounded-2xl border border-line/40 bg-ink/50 p-4">
              <div className="font-display text-3xl font-bold text-brass">{highConfidenceCount}</div>
              <div className="mono text-[11px] uppercase tracking-wider text-muted-text mt-1">Must-Have (High)</div>
            </div>
            <div className="rounded-2xl border border-line/40 bg-ink/50 p-4">
              <div className="font-display text-3xl font-bold text-emerald-400">{categoriesPresent.length}</div>
              <div className="mono text-[11px] uppercase tracking-wider text-muted-text mt-1">Categories Covered</div>
            </div>
          </div>
        </div>

        {/* Skill Signal Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div>
              <h3 className="font-display text-xl font-bold text-ink-text">Skill Signal Breakdown</h3>
              <p className="text-xs text-muted-text">Extracted skill requirements categorized by competency area</p>
            </div>
            <span className="mono text-xs font-medium text-brass">{jd.skills.length} requirements identified</span>
          </div>

          {jd.skills.length === 0 ? (
            <div className="rounded-2xl border border-line bg-panel/30 p-12 text-center text-muted-text">
              No skill signals detected. Try uploading a more comprehensive JD.
            </div>
          ) : (
            <div className="grid gap-3.5">
              {jd.skills.map((s, i) => {
                const catColor = categoryColors[s.category_code] || categoryColors.OTHER;
                const confStyle = confidenceStyles[s.confidence] || confidenceStyles.medium;
                const catLabel = CATEGORY_LABEL[s.category_code] || s.category_code;

                return (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-2xl border border-line/60 bg-panel/50 p-5 transition-all duration-200 hover:border-brass/50 hover:bg-panel/80 hover:shadow-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Category Code Pill */}
                          <span className={`inline-flex items-center rounded-lg px-2.5 py-1 mono text-[11px] font-bold border ${catColor.bg} ${catColor.text} ${catColor.border}`}>
                            {catLabel} · {s.category_code}
                          </span>

                          {/* Skill Name */}
                          <h4 className="font-display text-lg font-bold text-ink-text group-hover:text-brass transition-colors">
                            {s.skill_name}
                          </h4>
                        </div>

                        {/* Evidence Quote */}
                        {s.evidence && (
                          <div className="mt-2.5 rounded-xl border border-line/30 bg-ink/50 px-4 py-2.5 text-xs italic text-muted-text/90 leading-relaxed">
                            "{s.evidence}"
                          </div>
                        )}
                      </div>

                      {/* Confidence Tag */}
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 mono text-[10px] font-semibold uppercase tracking-wider ${confStyle.bg} ${confStyle.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${confStyle.dot}`} />
                        {s.confidence}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Navigation Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/40 pt-6">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 rounded-xl border border-line/60 bg-panel/60 px-5 py-3 text-sm font-semibold text-ink-text transition-all hover:bg-panel hover:border-brass/50 active:scale-95"
          >
            <svg className="h-4 w-4 text-brass" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Upload Another JD</span>
          </button>

          <button
            onClick={() => nav({ to: "/resume" })}
            className="group flex items-center gap-2.5 rounded-xl bg-brass px-7 py-3.5 text-sm font-bold text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95"
          >
            <span>Continue to Resume Parsing</span>
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // VIEW 3: INITIAL UPLOAD VIEW (When no JD uploaded yet)
  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        <header className="text-center space-y-3">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-text md:text-4xl">
            Upload Job Description
          </h1>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-text">
            Upload any job description as a <strong className="text-ink-text font-medium">PDF or DOCX</strong> file to analyze key responsibilities, extract technical requirements, and view mapped skill signals.
          </p>
        </header>

        {/* Upload Drop Zone Container */}
        <div className="rounded-3xl border border-line/60 bg-panel/60 p-4 shadow-xl backdrop-blur-md">
          <DropZone
            label="Drop PDF or DOCX file here or click to browse"
            onFile={handleFile}
            loading={loading}
            accept=".pdf,.docx,.txt"
          />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400 backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Extraction Failed</span>
            </div>
            <p className="mt-1.5 text-xs text-red-300/80">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyDial({ caption }: { caption: string }) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-line bg-panel/20 p-12 text-center">
      <svg width="200" height="200" viewBox="0 0 220 220" className="opacity-40">
        <circle cx="110" cy="110" r="92" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        <circle cx="110" cy="110" r="22" fill="none" stroke="var(--line)" strokeWidth="1.5" />
        {Array.from({ length: 12 }).map((_, i) => {
          const a = -Math.PI / 2 + i * ((Math.PI * 2) / 12);
          const x1 = 110 + Math.cos(a) * 22, y1 = 110 + Math.sin(a) * 22;
          const x2 = 110 + Math.cos(a) * 92, y2 = 110 + Math.sin(a) * 92;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line)" strokeWidth="1.5" />;
        })}
      </svg>
      <p className="mt-6 max-w-xs text-sm text-muted-text leading-relaxed">{caption}</p>
    </div>
  );
}