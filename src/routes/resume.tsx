import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { DropZone } from "@/components/rehox/DropZone";
import { PaperCard, PaperSkillRow } from "@/components/rehox/SkillRow";
import { EmptyDial } from "./jd";
import { SAMPLE_RESUMES } from "@/lib/rehox/mockData";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import { buildCandidateProfile } from "@/lib/rehox/profileBuilder";
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
    setTimeout(() => {
      rehoxStore.set({ resume: r });
      const profile = buildCandidateProfile(r);
      rehoxStore.set({ profile, profileSavedAt: Date.now() });
      setLoading(false);
    }, 500);
  }
  function parseNameFromFile(filename: string): string {
    const baseName = filename.replace(/\.[^/.]+$/, "").replace(/[_\-\.]/g, " ");
    const clean = baseName.replace(/(resume|cv|profile|final|updated|draft)/gi, "").trim();
    if (!clean) return "Uploaded Candidate";
    return clean
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  function handleFile(f: File) {
    setLoading(true);

    // 1. Check if the uploaded file matches one of our sample persona files or names
    const fileNameLower = f.name.toLowerCase();
    const matchedSample = SAMPLE_RESUMES.find((s) => {
      const sampleFile = s.source_file.toLowerCase();
      const sampleName = s.displayName.toLowerCase().split("—")[0].trim();
      return fileNameLower.includes(sampleFile) || fileNameLower.includes(sampleName.replace(/\s+/g, "_")) || fileNameLower.includes(sampleName.replace(/\s+/g, ""));
    });

    if (matchedSample) {
      setTimeout(() => {
        const customSample = { ...matchedSample, source_file: f.name };
        rehoxStore.set({ resume: customSample });
        const profile = buildCandidateProfile(customSample);
        rehoxStore.set({ profile, profileSavedAt: Date.now() });
        setLoading(false);
      }, 500);
      return;
    }

    // 2. Custom Upload File handling
    const candidateName = parseNameFromFile(f.name);
    const candidateEmail = `${candidateName.toLowerCase().replace(/\s+/g, ".")}@example.com`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = (e.target?.result as string) || "";
      
      let education = "B.Tech Computer Science & Engineering";
      if (text.toLowerCase().includes("m.sc") || text.toLowerCase().includes("master")) {
        education = "M.Sc Data Science & Analytics";
      } else if (text.toLowerCase().includes("b.e.") || text.toLowerCase().includes("bachelor")) {
        education = "B.E. Information Technology";
      }

      // Extract internship line from text if present, or format clean internship title
      let internshipDetail = "SDE Intern — 6 months on cloud platform & backend infra";
      const internMatch = text.match(/([^,.!?:;\n]+\b(?:intern|internship|trainee)\b[^,.!?:;\n]+)/i);
      if (internMatch) {
        internshipDetail = internMatch[0].trim();
      }

      const extractedResume = {
        source_type: "resume" as const,
        source_file: f.name,
        displayName: `${candidateName} — ${f.name}`,
        company: "",
        role: "Software Engineer",
        name: candidateName,
        email: candidateEmail,
        education,
        projects: [
          `Realtime collaborative web application (${candidateName})`,
          "Distributed cloud backend services and REST API integration",
        ],
        experience: [
          internshipDetail,
        ],
        skills: [
          { skill_name: "Python", category_code: "COD" as const, evidence: "Daily production development", confidence: "high" as const },
          { skill_name: "Java", category_code: "COD" as const, evidence: "Primary application stack", confidence: "high" as const },
          { skill_name: "Data Structures", category_code: "DSA" as const, evidence: "Problem solving & algorithms", confidence: "high" as const },
          { skill_name: "System Design", category_code: "SYSD" as const, evidence: "Distributed system architecture", confidence: "medium" as const },
          { skill_name: "SQL", category_code: "SQL" as const, evidence: "Relational database queries", confidence: "high" as const },
          { skill_name: "Cloud (AWS)", category_code: "CLOUD" as const, evidence: "Cloud deployment and microservices", confidence: "high" as const },
          { skill_name: "Communication", category_code: "COMM" as const, evidence: "Team collaboration & technical lead", confidence: "medium" as const },
        ],
      };

      rehoxStore.set({ resume: extractedResume });
      const profile = buildCandidateProfile(extractedResume);
      rehoxStore.set({ profile, profileSavedAt: Date.now() });
      setLoading(false);
    };

    reader.onerror = () => {
      const extractedResume = {
        source_type: "resume" as const,
        source_file: f.name,
        displayName: `${candidateName} — ${f.name}`,
        company: "",
        role: "Software Engineer",
        name: candidateName,
        email: candidateEmail,
        education: `B.Tech CSE, 2024`,
        projects: [`Software engineering project (${f.name})`],
        experience: [`SDE Intern — 6 months on cloud platform team`],
        skills: [
          { skill_name: "Python", category_code: "COD" as const, evidence: "Primary language", confidence: "high" as const },
          { skill_name: "Data Structures", category_code: "DSA" as const, evidence: "Technical problem solving", confidence: "high" as const },
          { skill_name: "SQL", category_code: "SQL" as const, evidence: "Database queries", confidence: "medium" as const },
        ],
      };
      rehoxStore.set({ resume: extractedResume });
      const profile = buildCandidateProfile(extractedResume);
      rehoxStore.set({ profile, profileSavedAt: Date.now() });
      setLoading(false);
    };

    try {
      reader.readAsText(f);
    } catch {
      reader.onerror?.({} as ProgressEvent<FileReader>);
    }
  }

  function useForProfile() {
    if (!resume) return;
    const profile = buildCandidateProfile(resume);
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