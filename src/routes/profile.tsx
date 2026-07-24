import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import { CATEGORY_ORDER, CATEGORY_LABEL, type CategoryCode, type Profile, type Skill } from "@/lib/rehox/types";
import { buildCandidateProfile, normalizeSkill, cleanEvidence, mergeDuplicateSkills } from "@/lib/rehox/profileBuilder";
import { saveProfileToSupabase } from "@/lib/rehox/supabase";

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

  // ONLY populate data if it comes from resume parsing output
  const initialProfile = useMemo(() => {
    if (resumeSource) {
      return buildCandidateProfile(resumeSource);
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
      const built = buildCandidateProfile(resumeSource);
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

  // If no resume parsing data has been provided yet
  if (!resumeSource && !profile.name && profile.skills.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-6">
        <div className="rounded-xl border border-brass/40 bg-panel/50 p-8 space-y-4 shadow-lg">
          <div className="mono text-xs uppercase tracking-widest text-brass font-bold">Step 03 · Profile Builder</div>
          <h1 className="font-display text-2xl font-bold text-ink-text">No Resume Parsing Data Available</h1>
          <p className="text-sm text-muted-text">
            Profile data is built directly from Resume Parsing output. Please upload or select a resume in the previous step to generate your profile.
          </p>
          <div className="pt-2">
            <Link
              to="/resume"
              className="inline-flex items-center justify-center rounded-md bg-brass px-5 py-2.5 text-sm font-medium text-primary-foreground hover:brightness-110 transition-colors shadow"
            >
              ← Go to Resume Parsing Step
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-brass">Candidate Profile Builder</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Candidate Profile</h1>
          <p className="mt-1 text-sm text-muted-text">
            Generated directly from Resume Parsing output. Fill or edit remaining entries manually.
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
            className="rounded-md bg-brass px-4 py-2 text-xs font-medium text-primary-foreground hover:brightness-110 transition-colors shadow-sm"
          >
            Save & Continue to Talent Check →
          </button>
        </div>
      </div>

      {/* Resume Source Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-panel/40 p-3.5 rounded-lg border border-line text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-ink-text font-medium">
            Extracted from resume parsing: <code className="mono text-brass">{resumeSource?.source_file || profile.cv_file || "Uploaded Resume"}</code>
          </span>
        </div>

        <Link to="/resume" className="text-xs text-brass hover:underline mono">
          Change Resume →
        </Link>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex border-b border-line bg-panel/40 p-1 rounded-lg gap-1">
        {[
          { id: "basics", label: "1. Basics" },
          { id: "skills", label: "2. Skills & Categories" },
          { id: "experience", label: "3. Hackathons & Internships" },
          { id: "certs", label: "4. Certifications & Roles" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={[
              "flex-1 py-2.5 px-3 text-xs font-medium rounded-md transition-colors text-center",
              activeTab === tab.id
                ? "bg-brass/15 text-brass border border-brass/40 shadow-sm"
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
          <Section title="Basic Information" hint="Extracted from resume parsing. Edit or fill remaining fields manually.">
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Full Name"
                value={profile.name}
                onChange={(v) => setProfile({ ...profile, name: v })}
                placeholder="Candidate Name"
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
                label="Education"
                value={profile.education}
                onChange={(v) => setProfile({ ...profile, education: v })}
                span={2}
                placeholder="Degree & Institution"
              />

              <div className="md:col-span-2 space-y-1.5">
                <div className="mono text-[10px] uppercase tracking-widest text-muted-text">CV Source Document</div>
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
          <Section title="Normalized Candidate Skills" hint="Categorized from resume parsing. Add or edit skills manually.">
            <div className="space-y-2.5">
              {profile.skills.map((s, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-panel/60 px-3.5 py-2.5 text-sm"
                >
                  <span className="mono rounded bg-ink px-2 py-0.5 text-[10px] font-bold tracking-widest text-brass border border-line">
                    {s.category_code}
                  </span>

                  <div className="flex-1 font-medium text-ink-text min-w-[140px]">
                    {s.skill_name}
                  </div>

                  <div className="flex-1 text-xs text-muted-text min-w-[200px] border-l border-line/40 pl-3">
                    <span className="mono text-[10px] uppercase text-black/50 mr-1">Evidence:</span>
                    <input
                      type="text"
                      value={s.evidence}
                      onChange={(e) => updateSkillEvidence(i, e.target.value)}
                      className="bg-transparent text-xs text-ink-text focus:outline-none hover:bg-ink/30 px-1 rounded transition-colors w-full"
                    />
                  </div>

                  <span
                    className={[
                      "mono text-[10px] px-2 py-0.5 rounded uppercase font-semibold",
                      s.confidence === "high"
                        ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50"
                        : s.confidence === "medium"
                        ? "bg-amber-950/40 text-amber-400 border border-amber-800/50"
                        : "bg-slate-900/60 text-slate-400 border border-slate-700/50",
                    ].join(" ")}
                  >
                    {s.confidence}
                  </span>

                  <button
                    onClick={() => removeSkill(i)}
                    className="text-xs text-muted-text hover:text-alert-coral transition-colors"
                  >
                    remove
                  </button>
                </div>
              ))}
              {profile.skills.length === 0 && (
                <div className="text-sm text-muted-text italic">No skills extracted from resume. Add skills manually below.</div>
              )}
            </div>

            <SkillAdder onAdd={addSkill} />
          </Section>
        )}

        {activeTab === "experience" && (
          <Section title="Hackathons & Internships" hint="Detected from resume output. Add remaining manually if needed.">
            <ListEditor
              label="Hackathons"
              items={profile.hackathons}
              onChange={(v) => setProfile({ ...profile, hackathons: v })}
              placeholder="e.g. Hackathon Finalist"
              emptyNotice="No hackathons detected from resume"
            />

            <ListEditor
              label="Internships"
              items={profile.internships}
              onChange={(v) => setProfile({ ...profile, internships: v })}
              placeholder="e.g. SDE Intern"
              emptyNotice="No internships detected from resume"
            />
          </Section>
        )}

        {activeTab === "certs" && (
          <Section title="Certifications & Preferred Roles" hint="Certifications and preferred role entries.">
            <ListEditor
              label="Certifications"
              items={profile.certifications}
              onChange={(v) => setProfile({ ...profile, certifications: v })}
              placeholder="e.g. AWS Certified"
              emptyNotice="No certifications detected from resume"
            />

            <div className="pt-3 border-t border-line">
              <ListEditor
                label="Preferred Roles"
                items={profile.preferred_roles}
                onChange={(v) => setProfile({ ...profile, preferred_roles: v })}
                placeholder="e.g. Backend Engineer"
                emptyNotice="No preferred roles specified"
              />
            </div>
          </Section>
        )}
      </div>

      {/* Page Actions Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-line">
        <div className="text-xs text-muted-text mono">
          Candidate profile automatically saved and ready for Talent Check and Skill Match.
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSaveAndNext("/talent-check")}
            className="rounded-md border border-line px-4 py-2 text-xs font-medium text-ink-text hover:border-brass transition-colors"
          >
            Run Talent Check →
          </button>
          <button
            onClick={() => handleSaveAndNext("/skill-match")}
            className="rounded-md bg-brass px-5 py-2 text-xs font-medium text-primary-foreground hover:brightness-110 transition-colors shadow-sm"
          >
            Run Skill Match →
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-panel/30 p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line/40 pb-3">
        <h2 className="font-display text-lg font-semibold text-ink-text">{title}</h2>
        {hint && <span className="text-xs text-muted-text">{hint}</span>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  span,
  mono,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  span?: number;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={span === 2 ? "md:col-span-2" : ""}>
      <div className="mono text-[10px] uppercase tracking-widest text-muted-text">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-ink-text focus:border-brass focus:outline-none transition-colors",
          mono ? "mono" : "",
        ].join(" ")}
      />
    </label>
  );
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
  emptyNotice,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder: string;
  emptyNotice?: string;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="space-y-2">
      <div className="mono text-[10px] uppercase tracking-widest text-muted-text">{label}</div>
      <div className="space-y-1.5">
        {items.map((it, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-md border border-line bg-ink px-3 py-1.5 text-sm"
          >
            <span className="flex-1 text-ink-text">{it}</span>
            <button
              className="text-xs text-muted-text hover:text-alert-coral transition-colors"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              remove
            </button>
          </div>
        ))}
        {items.length === 0 && emptyNotice && (
          <div className="text-xs text-muted-text italic px-1 py-1">{emptyNotice}</div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm text-ink-text focus:border-brass focus:outline-none"
        />
        <button
          className="rounded-md border border-line px-3 py-2 text-sm text-ink-text hover:border-brass transition-colors"
          onClick={() => {
            if (draft.trim()) {
              onChange([...items, draft.trim()]);
              setDraft("");
            }
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

function SkillAdder({ onAdd }: { onAdd: (s: Skill) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState<CategoryCode>("COD");
  const [confidence, setConfidence] = useState<Skill["confidence"]>("medium");
  const [evidence, setEvidence] = useState("");

  return (
    <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-line pt-4">
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