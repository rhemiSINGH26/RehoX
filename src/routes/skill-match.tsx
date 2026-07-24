import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SkillDial } from "@/components/rehox/SkillDial";
import { SAMPLE_JDS } from "@/lib/rehox/mockData";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import { runSkillMatch } from "@/lib/rehox/compute";
import { CATEGORY_LABEL } from "@/lib/rehox/types";
import { EmptyState } from "./talent-check";

export const Route = createFileRoute("/skill-match")({
  head: () => ({
    meta: [
      { title: "Skill Match · RehoX" },
      { name: "description", content: "Compare your profile to a specific JD — with a score and a gap list." },
      { property: "og:title", content: "Skill Match · RehoX" },
      { property: "og:description", content: "See exactly which JD skills you match and which you're missing." },
    ],
  }),
  component: SkillMatchPage,
});

function SkillMatchPage() {
  const profile = useRehox((s) => s.profile);
  const currentJd = useRehox((s) => s.jd);

  const allJds = useMemo(() => {
    const list = [...SAMPLE_JDS];
    if (currentJd && !list.find((j) => j.source_file === currentJd.source_file)) list.unshift(currentJd);
    return list;
  }, [currentJd]);

  const [jdFile, setJdFile] = useState(currentJd?.source_file ?? SAMPLE_JDS[0].source_file);
  const jd = allJds.find((j) => j.source_file === jdFile) ?? allJds[0];

  const result = useMemo(() => profile ? runSkillMatch(profile, jd) : null, [profile, jd]);
  useEffect(() => { if (result) rehoxStore.set({ skillMatch: result }); }, [result]);

  if (!profile) {
    return <EmptyState title="No profile yet." body="Skill Match compares your profile against one specific JD."
      ctaTo="/profile" ctaLabel="Build your profile" />;
  }

  const jdCats = new Set(jd.skills.map((s) => s.category_code));
  const profileCatLevel = new Map<string, number>();
  for (const s of profile.skills) {
    profileCatLevel.set(s.category_code, Math.max(profileCatLevel.get(s.category_code) ?? 0, s.confidence === "high" ? 8 : s.confidence === "medium" ? 6 : 4));
  }
  const dialData = Array.from(jdCats).map((c) => ({
    code: c, required: 8, candidate: profileCatLevel.get(c) ?? 0,
  }));
  const r = result!;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-brass">Skill Match</div>
          <h1 className="mt-2 font-display text-3xl font-bold">How well do you fit this JD?</h1>
        </div>
        <label className="text-sm">
          <span className="mono block text-[10px] uppercase tracking-widest text-muted-text">JD</span>
          <select value={jdFile} onChange={(e) => setJdFile(e.target.value)}
            className="mt-1 rounded-md border border-line bg-ink px-3 py-2 text-sm max-w-[360px]">
            {allJds.map((j) => <option key={j.source_file} value={j.source_file}>{j.company} — {j.role}</option>)}
          </select>
        </label>
      </header>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr),320px]">
        <div className="rounded-xl border border-line bg-panel/30 p-6 flex justify-center">
          <SkillDial data={dialData} size={380} compact />
        </div>
        <div className="rounded-xl border border-line bg-panel/30 p-6">
          <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Match</div>
          <div className="mt-1 mono text-6xl font-bold text-brass">{r.match_score}</div>
          <div className="mt-1 text-sm text-muted-text">out of 100 against {jd.role}</div>
          <div className="mt-6 border-t border-line pt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="mono text-[10px] uppercase tracking-widest text-alert-coral">Missing</div>
              <div className="mt-1 text-2xl font-display">{r.missing_skills.length}</div>
            </div>
            <div>
              <div className="mono text-[10px] uppercase tracking-widest text-signal-teal">Matched</div>
              <div className="mt-1 text-2xl font-display">{r.matched_skills.length}</div>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-alert-coral/40 bg-alert-coral/5 p-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-alert-coral" />
          <h2 className="font-display text-lg font-semibold">Missing skills — close these first</h2>
        </div>
        <div className="mt-4 space-y-3">
          {r.missing_skills.length === 0 && <div className="text-sm text-muted-text">No missing skills for this JD.</div>}
          {r.missing_skills.map((s, i) => (
            <div key={i} className="rounded-md border border-line bg-ink/60 p-3">
              <div className="flex items-center gap-2">
                <span className="mono rounded-sm bg-panel px-1.5 py-0.5 text-[10px] tracking-widest text-brass">{s.category_code}</span>
                <span className="text-sm font-medium">{s.skill_name}</span>
                <span className="ml-auto mono text-[10px] uppercase tracking-widest text-muted-text">{CATEGORY_LABEL[s.category_code]}</span>
              </div>
              <div className="mt-1 text-xs italic text-muted-text">Why it matters: {s.evidence}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-signal-teal/30 bg-signal-teal/5 p-6">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-signal-teal" />
          <h2 className="font-display text-lg font-semibold">Matched skills</h2>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {r.matched_skills.map((s, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border border-line bg-ink/60 px-3 py-2 text-sm">
              <span className="mono rounded-sm bg-panel px-1.5 py-0.5 text-[10px] tracking-widest text-signal-teal">{s.category_code}</span>
              <span>{s.skill_name}</span>
            </div>
          ))}
          {r.matched_skills.length === 0 && <div className="text-sm text-muted-text">No matches yet.</div>}
        </div>
      </section>
    </div>
  );
}