import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DropZone } from "@/components/rehox/DropZone";
import { PaperCard, PaperSkillRow } from "@/components/rehox/SkillRow";
import { EmptyDial } from "./jd";
import { SAMPLE_RESUMES } from "@/lib/rehox/mockData";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import type { Profile } from "@/lib/rehox/types";

export const Route = createFileRoute("/resume")({
  head: () => ({
    meta: [
      { title: "Resume Parsing · RehoX" },
      { name: "description", content: "Upload a resume to see the skills it shows — with evidence and confidence." },
      { property: "og:title", content: "Resume Parsing · RehoX" },
      { property: "og:description", content: "Turn a resume into structured skills, projects, and experience." },
    ],
  }),
  component: ResumePage,
});

function ResumePage() {
  const resume = useRehox((s) => s.resume);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  function pickSample(file: string) {
    const r = SAMPLE_RESUMES.find((x) => x.source_file === file);
    if (!r) return;
    setLoading(true);
    setTimeout(() => { rehoxStore.set({ resume: r }); setLoading(false); }, 500);
  }
  function handleFile(f: File) {
    setLoading(true);
    setTimeout(() => {
      const base = SAMPLE_RESUMES[0];
      rehoxStore.set({ resume: { ...base, source_file: f.name } });
      setLoading(false);
    }, 700);
  }

  function useForProfile() {
    if (!resume) return;
    const dn = (resume as { displayName?: string }).displayName;
    const profile: Profile = {
      name: dn ? dn.split(" — ")[0] : "Candidate",
      email: "you@example.com",
      education: resume.education ?? "",
      skills: resume.skills,
      hackathons: [],
      internships: resume.experience ?? [],
      certifications: [],
      preferred_roles: resume.role ? [resume.role] : [],
      cv_file: resume.source_file,
    };
    rehoxStore.set({ profile, profileSavedAt: Date.now() });
    nav({ to: "/profile" });
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-4">
        <header>
          <div className="mono text-xs uppercase tracking-widest text-brass">Step 02 · Resume Parsing</div>
          <h1 className="mt-2 font-display text-3xl font-bold">Upload a resume to see what it shows.</h1>
          <p className="mt-2 text-sm text-muted-text">Skills, projects, education, experience — extracted as structured data.</p>
        </header>
        <DropZone label="Upload a resume" onFile={handleFile} loading={loading} />
        <div className="rounded-xl border border-line bg-panel/40 p-4">
          <label className="mono text-[10px] uppercase tracking-widest text-muted-text">Try a sample resume</label>
          <select
            className="mt-2 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-ink-text focus:border-brass focus:outline-none"
            defaultValue=""
            onChange={(e) => e.target.value && pickSample(e.target.value)}
          >
            <option value="" disabled>Select a persona</option>
            {SAMPLE_RESUMES.map((r) => (
              <option key={r.source_file} value={r.source_file}>{r.displayName}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        {loading ? (
          <PaperCard title="Reading resume" subtitle="Extracting skills and structure…">
            <div className="space-y-2">{[...Array(6)].map((_,i)=><div key={i} className="h-10 animate-pulse rounded bg-black/5"/>)}</div>
          </PaperCard>
        ) : resume ? (
          <div className="space-y-4">
            <PaperCard title={`Resume · ${resume.source_file}`} subtitle={resume.role}>
              <div className="mb-3 mono text-[10px] uppercase tracking-widest text-black/50">Skills</div>
              {resume.skills.map((s, i) => <PaperSkillRow key={i} skill={s} />)}
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-black/10 pt-4 text-sm">
                <KV label="Education" value={resume.education} />
                <KV label="Experience" value={(resume.experience ?? []).join(" · ")} />
                <KV label="Projects" value={(resume.projects ?? []).join(" · ")} />
                <KV label="File" value={resume.source_file} mono />
              </div>
            </PaperCard>
            <div className="flex justify-end">
              <button onClick={useForProfile}
                className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
                Use this to build my profile →
              </button>
            </div>
          </div>
        ) : (
          <EmptyDial caption="Upload a resume to see what it shows." />
        )}
      </div>
    </div>
  );
}

function KV({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-widest text-black/50">{label}</div>
      <div className={mono ? "mono text-xs" : "text-sm"}>{value || "—"}</div>
    </div>
  );
}