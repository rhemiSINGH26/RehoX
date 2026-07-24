import { createFileRoute, Link } from "@tanstack/react-router";
import { SkillDial } from "@/components/rehox/SkillDial";
import { CATEGORY_ORDER } from "@/lib/rehox/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RehoX — Find out how ready you actually are" },
      { name: "description", content: "Built on the RADIX 12-skillset framework and real hiring data used at Google, Microsoft, and Oracle FSS." },
      { property: "og:title", content: "RehoX — precision readiness for real roles" },
      { property: "og:description", content: "Upload a JD. Upload your resume. See the exact gaps between what a role wants and what you show." },
    ],
  }),
  component: Index,
});

const DEMO = CATEGORY_ORDER.map((code, i) => ({
  code,
  required: [8,9,7,7,8,6,7,8,7,8,6,7][i],
  candidate: [6,7,5,6,7,4,5,7,6,6,5,6][i],
}));

function Index() {
  return (
    <div className="grid gap-10 md:grid-cols-[1.1fr,1fr] md:items-center">
      <section>
        <div className="mono text-xs uppercase tracking-[0.22em] text-brass">The X to hit</div>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
          Find out how ready<br />you actually are.
        </h1>
        <p className="mt-5 max-w-lg text-base text-muted-text">
          RehoX is built on the same 12-skillset framework and real hiring
          data used to evaluate candidates at Google, Microsoft, and Oracle
          Financial Services Software.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link to="/resume"
            className="rounded-md bg-brass px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110">
            Start with your resume
          </Link>
          <Link to="/jd" className="text-sm text-ink-text underline underline-offset-4 decoration-line hover:decoration-brass">
            Or upload a job description first
          </Link>
        </div>
        <div className="mt-10 flex gap-8 text-xs text-muted-text mono uppercase tracking-widest">
          <div><span className="text-ink-text text-base">12</span> skillsets</div>
          <div><span className="text-ink-text text-base">3</span> companies</div>
          <div><span className="text-ink-text text-base">6</span> real roles</div>
        </div>
      </section>
      <section className="flex justify-center">
        <SkillDial data={DEMO} size={440} />
      </section>
    </div>
  );
}
