import type { Skill } from "@/lib/rehox/types";

const dot: Record<Skill["confidence"], string> = {
  high: "bg-signal-teal",
  medium: "bg-brass",
  low: "bg-muted-text",
};

export function SkillRow({ skill }: { skill: Skill }) {
  return (
    <div className="flex items-start gap-3 border-t border-line/60 py-2.5 first:border-t-0">
      <span className="mono shrink-0 rounded-sm bg-ink/60 px-1.5 py-0.5 text-[10px] tracking-widest text-brass">
        {skill.category_code}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-ink-text">{skill.skill_name}</div>
        <div className="mt-0.5 text-xs italic text-muted-text">{skill.evidence}</div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-text mono">
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${dot[skill.confidence]}`} />
        {skill.confidence}
      </span>
    </div>
  );
}

export function PaperCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-paper text-[color:oklch(0.19_0.03_260)] shadow-sm">
      <div className="border-b border-black/10 px-5 py-3">
        <div className="mono text-[10px] uppercase tracking-widest text-black/50">{title}</div>
        {subtitle && <div className="mt-0.5 text-sm font-medium">{subtitle}</div>}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

export function PaperSkillRow({ skill }: { skill: Skill }) {
  return (
    <div className="flex items-start gap-3 border-t border-black/10 py-2.5 first:border-t-0">
      <span className="mono shrink-0 rounded-sm bg-black/10 px-1.5 py-0.5 text-[10px] tracking-widest text-black/70">
        {skill.category_code}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium">{skill.skill_name}</div>
        <div className="mt-0.5 text-xs italic text-black/60">{skill.evidence}</div>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 text-[10px] uppercase tracking-widest text-black/60 mono">
        <span className={[
          "inline-block h-1.5 w-1.5 rounded-full",
          skill.confidence === "high" ? "bg-[color:oklch(0.55_0.10_190)]"
          : skill.confidence === "medium" ? "bg-[color:oklch(0.55_0.13_65)]"
          : "bg-black/40",
        ].join(" ")} />
        {skill.confidence}
      </span>
    </div>
  );
}