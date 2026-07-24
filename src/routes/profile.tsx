import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DropZone } from "@/components/rehox/DropZone";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import { CATEGORY_ORDER, CATEGORY_LABEL, type CategoryCode, type Profile, type Skill } from "@/lib/rehox/types";
import { buildCandidateProfile, normalizeSkill, cleanEvidence, mergeDuplicateSkills } from "@/lib/rehox/profileBuilder";
import { saveProfileToSupabase } from "@/lib/rehox/supabase";
import { fileToText } from "@/lib/rehox/file-to-text";
import { extractResumeSkills } from "@/lib/rehox/resume-extract";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile Builder · RehoX" },
      { name: "description", content: "Build candidate profile directly from resume parsing output." },
      { property: "og:title", content: "Profile Builder · RehoX" },
      { property: "og:description", content: "Candidate profile builder powered by resume parsing data." },
    ],
  }),
  component: ProfilePage,
});

function emptyProfile(): Profile {
  return {
    name: "",
    email: "",
    education: "",
    skills: [],
    hackathons: [],
    internships: [],
    certifications: [],
    preferred_roles: [],
    cv_file: "",
  };
}

export function ProfilePage() {
  const storedProfile = useRehox((s) => s.profile);
  const resumeSource = useRehox((s) => s.resume);
  const savedAt = useRehox((s) => s.profileSavedAt);
  const nav = useNavigate();

  const [activeTab, setActiveTab] = useState<"basics" | "skills" | "experience" | "certs">("basics");
  const [supabaseStatus, setSupabaseStatus] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Initial candidate profile calculation
  const initialProfile = useMemo(() => {
    if (resumeSource) {
      return buildCandidateProfile({ ...resumeSource, cv_file: resumeSource.source_file });
    }
    if (storedProfile && (storedProfile.name || storedProfile.skills.length > 0)) {
      return storedProfile;
    }
    return emptyProfile();
  }, [resumeSource, storedProfile]);

  const [profile, setProfile] = useState<Profile>(initialProfile);

  // Sync strictly when resume parsing output arrives
  useEffect(() => {
    if (resumeSource) {
      const built = buildCandidateProfile({ ...resumeSource, cv_file: resumeSource.source_file });
      setProfile(built);
    }
  }, [resumeSource]);

  // Keep output candidate profile updated in rehoxStore for downstream steps
  useEffect(() => {
    const t = setTimeout(() => {
      if (profile.name || profile.skills.length > 0) {
        const normalized = buildCandidateProfile(profile);
        rehoxStore.set({ profile: normalized, profileSavedAt: Date.now() });
        saveProfileToSupabase(normalized).then((res) => {
          if (res.success) setSupabaseStatus("Supabase Synced");
        });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [profile]);

  // Direct resume upload handler within Profile Builder
  async function handleDirectResumeUpload(f: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const text = await fileToText(f);
      const result = await extractResumeSkills({ data: { text, fileName: f.name } });
      rehoxStore.set({ resume: result });
      const built = buildCandidateProfile({ ...result, cv_file: f.name });
      setProfile(built);
      rehoxStore.set({ profile: built, profileSavedAt: Date.now() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  const savedLabel = useMemo(() => {
    if (!savedAt) return "Draft mode";
    const d = new Date(savedAt);
    return `Saved ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
  }, [savedAt]);

  const isEmailValid = useMemo(() => {
    if (!profile.email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email);
  }, [profile.email]);

  function addSkill(sk: Skill) {
    const normalized = normalizeSkill(sk);
    setProfile((p) => ({
      ...p,
      skills: mergeDuplicateSkills([...p.skills, normalized]),
    }));
  }

  function removeSkill(i: number) {
    setProfile((p) => ({
      ...p,
      skills: p.skills.filter((_, idx) => idx !== i),
    }));
  }

  function updateSkillEvidence(i: number, newEvidence: string) {
    setProfile((p) => {
      const updated = [...p.skills];
      updated[i] = { ...updated[i], evidence: cleanEvidence(newEvidence) };
      return { ...p, skills: updated };
    });
  }

  async function handleSaveAndNext(destination: "/talent-check" | "/skill-match") {
    const normalized = buildCandidateProfile(profile);
    rehoxStore.set({ profile: normalized, profileSavedAt: Date.now() });
    await saveProfileToSupabase(normalized);
    nav({ to: destination });
  }

  // If no resume parsing data has been provided yet, render centered upload dropzone
  if (!resumeSource && !profile.name && profile.skills.length === 0 && !uploading) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="mono text-xs uppercase tracking-widest text-brass font-bold">Profile Builder</div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-ink-text md:text-4xl">
            Build Candidate Profile from Resume
          </h1>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-text">
            Upload your resume document (<strong className="text-ink-text font-medium">PDF or DOCX</strong>) to extract skills, education, work experience, and automatically populate your candidate profile.
          </p>
        </div>

        <div className="rounded-3xl border border-line/60 bg-panel/60 p-4 shadow-xl backdrop-blur-md">
          <DropZone
            label="Drop PDF or DOCX resume here or click to browse"
            onFile={handleDirectResumeUpload}
            loading={uploading}
            accept=".pdf,.docx,.txt"
          />
        </div>

        {uploadError && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-sm text-red-400 backdrop-blur-sm shadow-md">
            <div className="flex items-center gap-2 font-semibold">
              <svg className="h-5 w-5 shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Resume Extraction Failed</span>
            </div>
            <p className="mt-1.5 text-xs text-red-300/80">{uploadError}</p>
          </div>
        )}
      </div>
    );
  }

  if (uploading) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="rounded-3xl border border-line/60 bg-panel/80 p-10 text-ink-text shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-4 border-b border-line/40 pb-6">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-brass border-t-transparent" />
            <div>
              <h3 className="font-display text-xl font-bold">Extracting Profile Details</h3>
              <p className="text-sm text-muted-text">Reading resume document, populating skills, education & experience…</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-brass font-semibold">Candidate Profile Builder</div>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink-text">Candidate Profile</h1>
          <p className="mt-1 text-sm text-muted-text">
            Extracted directly from resume parsing output. Review, edit, or add remaining fields below.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="mono text-[10px] uppercase tracking-widest text-signal-teal bg-signal-teal/10 px-2.5 py-1 rounded border border-signal-teal/20">
            {savedLabel}
          </span>
          {supabaseStatus && (
            <span className="mono text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40">
              ⚡ {supabaseStatus}
            </span>
          )}
          <button
            onClick={() => handleSaveAndNext("/talent-check")}
            className="rounded-xl bg-brass px-5 py-2.5 text-xs font-semibold text-primary-foreground shadow transition-all hover:brightness-110 active:scale-95"
          >
            Save & Continue to Talent Check →
          </button>
        </div>
      </div>

      {/* Resume Source Indicator & Re-upload Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-panel/60 p-4 rounded-2xl border border-line/60 text-xs shadow-sm">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-ink-text font-medium">
            Active Resume Source: <code className="mono text-brass font-bold">{resumeSource?.source_file || profile.cv_file || "Uploaded Resume"}</code>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer text-xs text-brass hover:underline mono font-semibold">
            <span>↑ Upload Different Resume</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleDirectResumeUpload(f);
              }}
            />
          </label>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-line bg-panel/40 p-1.5 rounded-xl gap-1.5 shadow-inner">
        {[
          { id: "basics", label: "1. Basics & Education" },
          { id: "skills", label: `2. Skills (${profile.skills.length})` },
          { id: "experience", label: `3. Experience (${profile.internships.length})` },
          { id: "certs", label: "4. Certifications & Roles" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={[
              "flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg transition-all text-center",
              activeTab === tab.id
                ? "bg-brass/20 text-brass border border-brass/40 shadow-sm"
                : "text-muted-text hover:text-ink-text hover:bg-ink/30",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Content Area */}
      <div className="space-y-6">
        {activeTab === "basics" && (
          <Section title="Basic Candidate Information" hint="Extracted from resume parsing output. Edit fields manually if needed.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Full Name"
                value={profile.name}
                onChange={(v) => setProfile({ ...profile, name: v })}
                placeholder="Candidate Full Name"
              />
              <div>
                <Field
                  label="Email Address"
                  value={profile.email}
                  onChange={(v) => setProfile({ ...profile, email: v })}
                  placeholder="candidate@example.com"
                />
                {!isEmailValid && (
                  <div className="mt-1 text-[10px] text-alert-coral mono">Please enter a valid email address</div>
                )}
              </div>
              <Field
                label="Education & Degree"
                value={profile.education}
                onChange={(v) => setProfile({ ...profile, education: v })}
                span={2}
                placeholder="Degree, Field of Study & Institution"
              />

              <div className="md:col-span-2 space-y-1.5">
                <div className="mono text-[10px] uppercase tracking-widest text-muted-text">CV Source Document Name</div>
                <input
                  type="text"
                  value={profile.cv_file}
                  onChange={(e) => setProfile({ ...profile, cv_file: e.target.value })}
                  placeholder="resume_filename.pdf"
                  className="w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-ink-text mono focus:border-brass focus:outline-none"
                />
              </div>
            </div>
          </Section>
        )}

        {activeTab === "skills" && (
          <Section title="Extracted & Normalized Candidate Skills" hint="Categorized technical competencies. You can edit evidence quotes or add new skills.">
            <div className="space-y-2.5">
              {profile.skills.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line/60 bg-panel/60 px-4 py-3 text-sm shadow-sm"
                >
                  <span className="mono rounded-lg bg-ink px-2.5 py-1 text-[10px] font-bold tracking-widest text-brass border border-line">
                    {s.category_code}
                  </span>

                  <div className="flex-1 font-semibold text-ink-text min-w-[140px]">
                    {s.skill_name}
                  </div>

                  <div className="flex-1 text-xs text-muted-text min-w-[200px] border-l border-line/40 pl-3">
                    <span className="mono text-[10px] uppercase text-muted-text/70 mr-1">Evidence:</span>
                    <input
                      type="text"
                      value={s.evidence}
                      onChange={(e) => updateSkillEvidence(i, e.target.value)}
                      className="bg-transparent text-xs text-ink-text focus:outline-none hover:bg-ink/30 px-1.5 py-0.5 rounded transition-colors w-full border border-transparent focus:border-brass/40"
                    />
                  </div>

                  <span
                    className={[
                      "mono text-[10px] px-2.5 py-1 rounded-full uppercase font-semibold",
                      s.confidence === "high"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : s.confidence === "medium"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                        : "bg-slate-500/10 text-slate-400 border border-slate-500/30",
                    ].join(" ")}
                  >
                    {s.confidence}
                  </span>

                  <button
                    onClick={() => removeSkill(i)}
                    className="text-xs text-muted-text hover:text-alert-coral transition-colors px-1"
                  >
                    remove
                  </button>
                </div>
              ))}
              {profile.skills.length === 0 && (
                <div className="py-6 text-center text-xs text-muted-text">
                  No skills listed yet. Add a skill manually below.
                </div>
              )}
            </div>

            <AddSkillForm onAdd={addSkill} />
          </Section>
        )}

        {activeTab === "experience" && (
          <Section title="Work Experience, Internships & Hackathons" hint="Extracted from resume. Add entries separated by commas.">
            <div className="space-y-4">
              <TagEditor
                label="Work Experience & Internships"
                hint="Roles, companies, and durations extracted from resume"
                items={profile.internships}
                onChange={(items) => setProfile({ ...profile, internships: items })}
                placeholder="e.g. Software Engineer Intern at Google (6 mos)"
              />
              <TagEditor
                label="Hackathons & Coding Competitions"
                hint="Hackathon achievements and awards"
                items={profile.hackathons}
                onChange={(items) => setProfile({ ...profile, hackathons: items })}
                placeholder="e.g. 1st Place - National Hackathon 2024"
              />
            </div>
          </Section>
        )}

        {activeTab === "certs" && (
          <Section title="Certifications & Preferred Job Roles" hint="Target positions and verified certificates.">
            <div className="space-y-4">
              <TagEditor
                label="Preferred / Target Roles"
                hint="Desired job titles or target roles"
                items={profile.preferred_roles}
                onChange={(items) => setProfile({ ...profile, preferred_roles: items })}
                placeholder="e.g. Backend Software Engineer"
              />
              <TagEditor
                label="Certifications & Courses"
                hint="Professional certifications and completed credentials"
                items={profile.certifications}
                onChange={(items) => setProfile({ ...profile, certifications: items })}
                placeholder="e.g. AWS Certified Solutions Architect"
              />
            </div>
          </Section>
        )}
      </div>

      {/* Save Action Banner */}
      <div className="flex items-center justify-between border-t border-line pt-6">
        <button
          onClick={() => handleSaveAndNext("/talent-check")}
          className="ml-auto rounded-xl bg-brass px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg transition-all hover:brightness-110 active:scale-95"
        >
          Save Profile & Continue to Talent Check →
        </button>
      </div>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line/60 bg-panel/50 p-6 space-y-4 shadow-sm">
      <div>
        <h3 className="font-display text-lg font-bold text-ink-text">{title}</h3>
        {hint && <p className="text-xs text-muted-text mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  span = 1,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  span?: number;
}) {
  return (
    <div className={span === 2 ? "md:col-span-2 space-y-1.5" : "space-y-1.5"}>
      <label className="mono text-[10px] uppercase tracking-widest text-muted-text font-semibold">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-ink px-3.5 py-2 text-sm text-ink-text focus:border-brass focus:outline-none transition-colors"
      />
    </div>
  );
}

function TagEditor({
  label,
  hint,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");

  function addItem() {
    if (inputValue.trim()) {
      onChange([...items, inputValue.trim()]);
      setInputValue("");
    }
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <div className="mono text-[10px] uppercase tracking-widest text-muted-text font-semibold">{label}</div>
      {hint && <div className="text-xs text-muted-text/80">{hint}</div>}

      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-ink/70 px-3 py-1 text-xs text-ink-text"
          >
            <span>{item}</span>
            <button
              onClick={() => removeItem(idx)}
              className="text-muted-text hover:text-alert-coral transition-colors"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addItem())}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-xs text-ink-text focus:border-brass focus:outline-none"
        />
        <button
          type="button"
          onClick={addItem}
          className="rounded-lg bg-line/60 px-4 py-2 text-xs font-semibold text-ink-text hover:bg-brass hover:text-primary-foreground transition-all"
        >
          + Add
        </button>
      </div>
    </div>
  );
}

function AddSkillForm({ onAdd }: { onAdd: (sk: Skill) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState<CategoryCode>("COD");
  const [confidence, setConfidence] = useState<Skill["confidence"]>("high");
  const [evidence, setEvidence] = useState("");

  return (
    <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line/40 pt-4">
      <div className="flex-1 min-w-[180px]">
        <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Skill Name</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Python programming"
          className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-ink-text focus:border-brass focus:outline-none"
        />
      </div>
      <div>
        <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Category Code</div>
        <select
          value={code}
          onChange={(e) => setCode(e.target.value as CategoryCode)}
          className="mt-1 rounded-md border border-line bg-ink px-3 py-2 text-sm text-ink-text mono focus:border-brass focus:outline-none"
        >
          {CATEGORY_ORDER.map((c) => (
            <option key={c} value={c}>
              {c} · {CATEGORY_LABEL[c]}
            </option>
          ))}
          <option value="OTHER">OTHER · Other</option>
        </select>
      </div>
      <div>
        <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Confidence</div>
        <select
          value={confidence}
          onChange={(e) => setConfidence(e.target.value as Skill["confidence"])}
          className="mt-1 rounded-md border border-line bg-ink px-3 py-2 text-sm text-ink-text focus:border-brass focus:outline-none"
        >
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </div>
      <div className="flex-1 min-w-[180px]">
        <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Short Evidence</div>
        <input
          value={evidence}
          onChange={(e) => setEvidence(e.target.value)}
          placeholder="e.g. 3 years production code"
          className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-ink-text focus:border-brass focus:outline-none"
        />
      </div>
      <button
        className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110 transition-colors"
        onClick={() => {
          if (name.trim()) {
            onAdd({
              skill_name: name.trim(),
              category_code: code,
              evidence: evidence.trim() || `Added manually`,
              confidence,
            });
            setName("");
            setEvidence("");
          }
        }}
      >
        Add skill
      </button>
    </div>
  );
}