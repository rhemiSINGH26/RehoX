import { createFileRoute, Link } from "@tanstack/react-router";
import { SkillDial } from "@/components/rehox/SkillDial";
import { CATEGORY_ORDER } from "@/lib/rehox/types";
import { useRehox } from "@/lib/rehox/store";
import { LoginPage } from "./login";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RehoX — Find out how ready you actually are" },
      {
        name: "description",
        content:
          "Built on the RADIX 12-skillset framework and real hiring data used at Google, Microsoft, and Oracle FSS.",
      },
      { property: "og:title", content: "RehoX — precision readiness for real roles" },
      {
        property: "og:description",
        content:
          "Upload a JD. Upload your resume. See the exact gaps between what a role wants and what you show.",
      },
    ],
  }),
  component: Index,
});

const DEMO = CATEGORY_ORDER.map((code, i) => ({
  code,
  required: [8, 9, 7, 7, 8, 6, 7, 8, 7, 8, 6, 7][i],
  candidate: [6, 7, 5, 6, 7, 4, 5, 7, 6, 6, 5, 6][i],
}));

function Index() {
  const userSession = useRehox((s) => s.userSession);

  // Initially render Login page if not authenticated
  if (!userSession) {
    return <LoginPage />;
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1.1fr,1fr] md:items-center animate-in fade-in duration-300">
      <section>
        <div className="mono text-xs uppercase tracking-[0.22em] text-brass font-bold">
          The X to hit
        </div>
        <h1 className="mt-4 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl text-ink-text">
          Find out how ready
          <br />
          you actually are.
        </h1>
        <p className="mt-5 max-w-lg text-base text-muted-text leading-relaxed">
          RehoX is built on the same 12-skillset framework and real hiring data used to evaluate
          candidates at Google, Microsoft, and Oracle Financial Services Software.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            to="/jd"
            className="rounded-xl bg-brass px-6 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 shadow-lg active:scale-95"
          >
            Start with Job Description (JD) →
          </Link>
          <Link
            to="/resume"
            className="rounded-xl border border-line bg-ink px-6 py-3 text-sm font-semibold text-ink-text hover:border-brass transition-all"
          >
            Upload Resume First
          </Link>
        </div>
        <div className="mt-10 flex gap-8 text-xs text-muted-text mono uppercase tracking-widest font-semibold">
          <div>
            <span className="text-ink-text text-base font-extrabold">12</span> skillsets
          </div>
          <div>
            <span className="text-ink-text text-base font-extrabold">3</span> companies
          </div>
          <div>
            <span className="text-ink-text text-base font-extrabold">6</span> real roles
          </div>
        </div>
      </section>
      <section className="flex justify-center">
        <SkillDial data={DEMO} size={440} />
      </section>
    </div>
  );
}
