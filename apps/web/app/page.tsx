import Link from "next/link";

const pillars = [
  {
    title: "Focused repo shape",
    body: "One app, one Supabase project, no extra packages until reuse becomes real.",
  },
  {
    title: "Fast local workflow",
    body: "Root scripts cover app dev, Supabase lifecycle, type generation, linting, and checks.",
  },
  {
    title: "Take-home ready",
    body: "The starter already matches the feature boundaries in the PRD without over-architecting.",
  },
];

const steps = [
  "npm install",
  "cp apps/web/.env.example apps/web/.env.local",
  "npm run db:start",
  "npm run dev",
];

export default function HomePage() {
  return (
    <main className="shell px-4 py-8 md:px-6 md:py-12">
      <section className="panel overflow-hidden rounded-[2rem]">
        <div className="grid gap-10 px-6 py-8 md:grid-cols-[1.4fr_0.9fr] md:px-10 md:py-10">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Searchable starter
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
                Clean starting point for the AI crawler analytics take-home.
              </h1>

              <p className="max-w-2xl text-base leading-7 text-[var(--muted-foreground)] md:text-lg">
                This workspace is set up for a Next.js frontend, Supabase database, and Edge
                Functions without dragging in unnecessary monorepo machinery.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
              >
                Open dashboard starter
              </Link>

              <a
                href="https://supabase.com/docs/guides/functions"
                className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/70"
              >
                Supabase docs
              </a>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[var(--border)] bg-[#132230] p-5 text-[#f6f0e7] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d6bfaa]">
                Quick start
              </span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs">Node 24 LTS</span>
            </div>

            <div className="space-y-3 font-[family-name:var(--font-mono)] text-sm">
              {steps.map((step) => (
                <div
                  key={step}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#f6f0e7]"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border-t border-[var(--border)] bg-white/45 px-6 py-6 md:grid-cols-3 md:px-10">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-[1.5rem] border border-[var(--border)] p-5">
              <h2 className="mb-2 text-lg font-semibold tracking-[-0.02em]">{pillar.title}</h2>
              <p className="text-sm leading-6 text-[var(--muted-foreground)]">{pillar.body}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
