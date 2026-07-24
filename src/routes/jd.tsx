import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DropZone } from "@/components/rehox/DropZone";
import { PaperCard, PaperSkillRow } from "@/components/rehox/SkillRow";
import { SAMPLE_JDS } from "@/lib/rehox/mockData";
import { rehoxStore, useRehox } from "@/lib/rehox/store";

export const Route = createFileRoute("/jd")({
  head: () => ({
    meta: [
      { title: "JD Analytics · RehoX" },
      { name: "description", content: "Upload a job description to see the skills it actually requires." },
      { property: "og:title", content: "JD Analytics · RehoX" },
      { property: "og:description", content: "Extract the skills, evidence, and confidence behind any job description." },
    ],
  }),
  component: JDPage,
});

function JDPage() {
  const jd = useRehox((s) => s.jd);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  function pickSample(fileName: string) {
    const found = SAMPLE_JDS.find((j) => j.source_file === fileName);
    if (!found) return;
    setLoading(true);
    setTimeout(() => { rehoxStore.set({ jd: found }); setLoading(false); }, 500);
  }

  function handleFile(f: File) {
    setLoading(true);
    setTimeout(() => {
      const sample = SAMPLE_JDS[0];
      rehoxStore.set({ jd: { ...sample, source_file: f.name } });
      setLoading(false);
    }, 700);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <header>
          <div className="mono text-xs uppercase tracking-widest text-brass">Step 01 · JD Analytics</div>
          <h1 className="mt-2 font-display text-3xl font-bold">Upload a job description.</h1>
          <p className="mt-2 text-sm text-muted-text">
            RehoX reads the JD and returns the skills it's really asking for — each with a category code and a confidence tag.
          </p>
        </header>
        <DropZone label="Upload a JD" onFile={handleFile} loading={loading} />
        <div className="rounded-xl border border-line bg-panel/40 p-4">
          <label className="mono text-[10px] uppercase tracking-widest text-muted-text">Try a sample JD</label>
          <select
            className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-ink-text focus:border-brass focus:outline-none"
            defaultValue=""
            onChange={(e) => e.target.value && pickSample(e.target.value)}
          >
            <option value="" disabled>Select a company · role</option>
            {SAMPLE_JDS.map((j) => (
              <option key={j.source_file} value={j.source_file}>{j.company} — {j.role}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        {loading ? (
          <PaperCard title="Reading JD" subtitle="Extracting required skills…">
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded bg-black/5" />
              ))}
            </div>
          </PaperCard>
        ) : jd ? (
          <div className="space-y-4">
            <PaperCard title={`JD · ${jd.source_file}`} subtitle={`${jd.company} — ${jd.role}`}>
              {jd.skills.map((s, i) => <PaperSkillRow key={i} skill={s} />)}
            </PaperCard>
            <div className="flex justify-end">
              <button
                onClick={() => nav({ to: "/resume" })}
                className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
              >
                Continue to Resume →
              </button>
            </div>
          </div>
        ) : (
          <EmptyDial caption="Upload a JD to see what it's really asking for." />
        )}
      </div>
    </div>
  );
}

export function EmptyDial({ caption }: { caption: string }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-line bg-panel/20 p-10">
      <svg width="220" height="220" viewBox="0 0 220 220" className="opacity-50">
        <circle cx="110" cy="110" r="92" fill="none" stroke="var(--line)" />
        <circle cx="110" cy="110" r="22" fill="none" stroke="var(--line)" />
        {Array.from({length:12}).map((_,i)=>{
          const a = -Math.PI/2 + i * (Math.PI*2/12);
          const x1 = 110 + Math.cos(a)*22, y1 = 110 + Math.sin(a)*22;
          const x2 = 110 + Math.cos(a)*92, y2 = 110 + Math.sin(a)*92;
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line)" />;
        })}
      </svg>
      <p className="mt-6 max-w-xs text-center text-sm text-muted-text">{caption}</p>
    </div>
  );
}