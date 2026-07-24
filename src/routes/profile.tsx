import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import { CATEGORY_ORDER, CATEGORY_LABEL, type CategoryCode, type Profile, type Skill } from "@/lib/rehox/types";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile Builder · RehoX" },
      { name: "description", content: "Build the profile that Talent Check and Skill Match run against." },
      { property: "og:title", content: "Profile Builder · RehoX" },
      { property: "og:description", content: "Skills, hackathons, certifications, preferred roles — all in one page." },
    ],
  }),
  component: ProfilePage,
});

function emptyProfile(): Profile {
  return {
    name: "", email: "", education: "",
    skills: [], hackathons: [], internships: [], certifications: [], preferred_roles: [],
    cv_file: "",
  };
}

function ProfilePage() {
  const stored = useRehox((s) => s.profile);
  const savedAt = useRehox((s) => s.profileSavedAt);
  const [profile, setProfile] = useState<Profile>(stored ?? emptyProfile());

  useEffect(() => { if (stored) setProfile(stored); }, [stored]);

  useEffect(() => {
    const t = setTimeout(() => {
      rehoxStore.set({ profile, profileSavedAt: Date.now() });
    }, 400);
    return () => clearTimeout(t);
  }, [profile]);

  const savedLabel = useMemo(() => {
    if (!savedAt) return "Not saved";
    const d = new Date(savedAt);
    return `Saved ${d.toLocaleTimeString()}`;
  }, [savedAt]);

  function addSkill(sk: Skill) {
    setProfile((p) => ({ ...p, skills: [...p.skills, sk] }));
  }
  function removeSkill(i: number) {
    setProfile((p) => ({ ...p, skills: p.skills.filter((_, idx) => idx !== i) }));
  }

  return (
    <div className="grid gap-8 md:grid-cols-[220px,1fr]">
      <aside className="md:sticky md:top-24 md:self-start">
        <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Sections</div>
        <ul className="mt-3 space-y-1 text-sm">
          {[
            ["basics","Basics"], ["skills","Skills"], ["experience","Hackathons & Internships"],
            ["certs","Certifications"], ["roles","Preferred Roles"], ["cv","CV"],
          ].map(([id,l]) => (
            <li key={id}><a href={`#${id}`} className="text-muted-text hover:text-ink-text">{l}</a></li>
          ))}
        </ul>
        <div className="mt-6 mono text-[10px] uppercase tracking-widest text-signal-teal">{savedLabel}</div>
      </aside>

      <div className="space-y-10">
        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="mono text-xs uppercase tracking-widest text-brass">Step 03 · Profile Builder</div>
            <h1 className="mt-2 font-display text-3xl font-bold">Your profile.</h1>
          </div>
          <button
            onClick={() => rehoxStore.set({ profile, profileSavedAt: Date.now() })}
            className="rounded-md border border-line px-3 py-2 text-sm hover:border-brass"
          >Save profile</button>
        </header>

        <Section id="basics" title="Basics">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name" value={profile.name} onChange={(v) => setProfile({ ...profile, name: v })} />
            <Field label="Email" value={profile.email} onChange={(v) => setProfile({ ...profile, email: v })} />
            <Field label="Education" value={profile.education} onChange={(v) => setProfile({ ...profile, education: v })} span={2} />
          </div>
        </Section>

        <Section id="skills" title="Skills" hint="Pre-filled from your resume. Edit freely.">
          <div className="space-y-2">
            {profile.skills.map((s, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-line bg-panel/40 px-3 py-2">
                <span className="mono rounded-sm bg-ink px-1.5 py-0.5 text-[10px] tracking-widest text-brass">{s.category_code}</span>
                <div className="flex-1 text-sm">{s.skill_name}</div>
                <span className="mono text-[10px] text-muted-text">{s.confidence}</span>
                <button onClick={() => removeSkill(i)} className="text-xs text-muted-text hover:text-alert-coral">remove</button>
              </div>
            ))}
            {profile.skills.length === 0 && <div className="text-sm text-muted-text">No skills yet. Add one below.</div>}
          </div>
          <SkillAdder onAdd={addSkill} />
        </Section>

        <Section id="experience" title="Hackathons & Internships">
          <ListEditor label="Hackathons" items={profile.hackathons} onChange={(v)=>setProfile({...profile, hackathons: v})} placeholder="e.g. HackMIT 2024 — finalist" />
          <ListEditor label="Internships" items={profile.internships} onChange={(v)=>setProfile({...profile, internships: v})} placeholder="e.g. SDE Intern, 6 months" />
        </Section>

        <Section id="certs" title="Certifications">
          <ListEditor label="Certifications" items={profile.certifications} onChange={(v)=>setProfile({...profile, certifications: v})} placeholder="e.g. AWS Certified Cloud Practitioner" />
        </Section>

        <Section id="roles" title="Preferred Roles">
          <ListEditor label="Preferred roles" items={profile.preferred_roles} onChange={(v)=>setProfile({...profile, preferred_roles: v})} placeholder="e.g. Backend Engineer" />
        </Section>

        <Section id="cv" title="CV">
          <Field label="CV file" value={profile.cv_file} onChange={(v) => setProfile({ ...profile, cv_file: v })} mono />
        </Section>

        <div className="flex justify-end gap-3">
          <Link to="/talent-check" className="rounded-md border border-line px-4 py-2 text-sm hover:border-brass">Run Talent Check →</Link>
          <Link to="/skill-match" className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">Run Skill Match →</Link>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-xl border border-line bg-panel/30 p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold">{title}</h2>
        {hint && <span className="text-xs text-muted-text">{hint}</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, value, onChange, span, mono }: { label: string; value: string; onChange: (v: string) => void; span?: number; mono?: boolean }) {
  return (
    <label className={span === 2 ? "md:col-span-2" : ""}>
      <div className="mono text-[10px] uppercase tracking-widest text-muted-text">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={[
          "mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm focus:border-brass focus:outline-none",
          mono ? "mono" : "",
        ].join(" ")}
      />
    </label>
  );
}

function ListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState("");
  return (
    <div>
      <div className="mono text-[10px] uppercase tracking-widest text-muted-text">{label}</div>
      <div className="mt-2 space-y-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-ink px-3 py-1.5 text-sm">
            <span className="flex-1">{it}</span>
            <button className="text-xs text-muted-text hover:text-alert-coral" onClick={() => onChange(items.filter((_,idx)=>idx!==i))}>remove</button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={draft} onChange={(e)=>setDraft(e.target.value)} placeholder={placeholder}
          className="flex-1 rounded-md border border-line bg-ink px-3 py-2 text-sm focus:border-brass focus:outline-none" />
        <button
          className="rounded-md border border-line px-3 py-2 text-sm hover:border-brass"
          onClick={() => { if (draft.trim()) { onChange([...items, draft.trim()]); setDraft(""); } }}
        >Add</button>
      </div>
    </div>
  );
}

function SkillAdder({ onAdd }: { onAdd: (s: Skill) => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState<CategoryCode>("COD");
  const [confidence, setConfidence] = useState<Skill["confidence"]>("medium");
  return (
    <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-line pt-3">
      <div className="flex-1 min-w-[200px]">
        <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Skill</div>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. Kubernetes"
          className="mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm focus:border-brass focus:outline-none" />
      </div>
      <div>
        <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Category</div>
        <select value={code} onChange={(e)=>setCode(e.target.value as CategoryCode)}
          className="mt-1 rounded-md border border-line bg-ink px-3 py-2 text-sm mono">
          {CATEGORY_ORDER.map((c) => <option key={c} value={c}>{c} · {CATEGORY_LABEL[c]}</option>)}
        </select>
      </div>
      <div>
        <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Confidence</div>
        <select value={confidence} onChange={(e)=>setConfidence(e.target.value as Skill["confidence"])}
          className="mt-1 rounded-md border border-line bg-ink px-3 py-2 text-sm">
          <option value="high">high</option><option value="medium">medium</option><option value="low">low</option>
        </select>
      </div>
      <button
        className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110"
        onClick={() => { if (name.trim()) { onAdd({ skill_name: name.trim(), category_code: code, evidence: "added manually", confidence }); setName(""); } }}
      >Add skill</button>
    </div>
  );
}