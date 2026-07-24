import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SkillDial } from "@/components/rehox/SkillDial";
import { COMPANIES, type Company } from "@/lib/rehox/mockData";
import { rehoxStore, useRehox } from "@/lib/rehox/store";
import { readinessLabel, runTalentCheck } from "@/lib/rehox/compute";
import { CATEGORY_LABEL } from "@/lib/rehox/types";

export const Route = createFileRoute("/talent-check")({
  head: () => ({
    meta: [
      { title: "Talent Check · RehoX" },
      { name: "description", content: "Compare your profile to a company's full 12-skillset bar." },
      { property: "og:title", content: "Talent Check · RehoX" },
      { property: "og:description", content: "The dial shows required level as the ring and your level as the fill. Gaps are visible as empty space." },
    ],
  }),
  component: TalentCheckPage,
});

function TalentCheckPage() {
  const profile = useRehox((s) => s.profile);
  const jd = useRehox((s) => s.jd);
  const defaultCompany = (jd?.company as Company) || "Google";
  const [company, setCompany] = useState<Company>(defaultCompany);

  const result = useMemo(() => profile ? runTalentCheck(profile, company) : null, [profile, company]);
  useEffect(() => { if (result) rehoxStore.set({ talentCheck: result }); }, [result]);

  if (!profile) {
    return (
      <EmptyState title="No profile yet."
        body="Talent Check compares your profile against a company's full 12-skillset bar."
        ctaTo="/profile" ctaLabel="Build your profile" />
    );
  }

  const r = result!;
  const dialData = r.skillset_gap.map((row) => ({
    code: row.category_code, required: row.required_level, candidate: row.candidate_level,
  }));
  const sortedGap = [...r.skillset_gap].sort((a, b) => Number(b.gap) - Number(a.gap) || (b.required_level - b.candidate_level) - (a.required_level - a.candidate_level));
  const gapCount = r.skillset_gap.filter((row) => row.gap).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mono text-xs uppercase tracking-widest text-brass">Talent Check</div>
          <h1 className="mt-2 font-display text-3xl font-bold">Are you at the company's bar?</h1>
        </div>
        <label className="text-sm">
          <span className="mono block text-[10px] uppercase tracking-widest text-muted-text">Company</span>
          <select value={company} onChange={(e) => setCompany(e.target.value as Company)}
            className="mt-1 rounded-md border border-line bg-ink px-3 py-2 text-sm">
            {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </header>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr),320px]">
        <div className="rounded-xl border border-line bg-panel/30 p-6">
          <div className="flex justify-center">
            <SkillDial data={dialData} size={460} />
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel/30 p-6">
          <div className="mono text-[10px] uppercase tracking-widest text-muted-text">Readiness</div>
          <div className="mt-1 font-display text-6xl font-bold">{r.readiness_score}</div>
          <div className="mt-1 text-sm text-brass">{readinessLabel(r.readiness_score)}</div>
          <div className="mt-6 border-t border-line pt-4 text-sm text-muted-text">
            {gapCount === 0 ? "No gaps against this company's bar." : `${gapCount} gap${gapCount === 1 ? "" : "s"} to close.`}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-line bg-panel/30 overflow-hidden">
        <div className="grid grid-cols-[80px,1fr,80px,80px,80px] gap-3 border-b border-line px-4 py-2 mono text-[10px] uppercase tracking-widest text-muted-text">
          <div>Code</div><div>Skillset</div><div>Req.</div><div>You</div><div>Status</div>
        </div>
        {sortedGap.map((row) => (
          <div key={row.category_code} className="grid grid-cols-[80px,1fr,80px,80px,80px] items-center gap-3 border-t border-line px-4 py-2.5 text-sm">
            <span className="mono text-brass">{row.category_code}</span>
            <span>{CATEGORY_LABEL[row.category_code]}</span>
            <span className="mono">{row.required_level}</span>
            <span className="mono">{row.candidate_level}</span>
            {row.gap ? (
              <span className="flex items-center gap-1.5 text-alert-coral"><span className="h-1.5 w-1.5 rounded-full bg-alert-coral" />gap</span>
            ) : (
              <span className="flex items-center gap-1.5 text-signal-teal"><span className="h-1.5 w-1.5 rounded-full bg-signal-teal" />met</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Link to="/skill-match" className="rounded-md bg-brass px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
          Run Skill Match →
        </Link>
      </div>
    </div>
  );
}

export function EmptyState({ title, body, ctaTo, ctaLabel }: { title: string; body: string; ctaTo: "/profile" | "/jd" | "/resume"; ctaLabel: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-dashed border-line bg-panel/30 p-10 text-center">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-2 text-sm text-muted-text">{body}</p>
      <Link to={ctaTo} className="mt-6 inline-block rounded-md bg-brass px-4 py-2 text-sm font-medium text-primary-foreground hover:brightness-110">
        {ctaLabel}
      </Link>
    </div>
  );
}