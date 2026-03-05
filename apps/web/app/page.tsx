import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const pillars = [
  {
    title: "Detect AI crawlers instantly",
    body: "Identify traffic from GPTBot, ClaudeBot, Perplexity, Gemini, and other AI agents hitting your content.",
  },
  {
    title: "Measure page-level impact",
    body: "See which URLs are crawled most, where activity spikes, and how crawler behavior shifts over time.",
  },
  {
    title: "Ship tracking in minutes",
    body: "Register a domain, copy the script or pixel snippet, deploy, then validate events in the activity feed.",
  },
];

export default async function HomePage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const firstRunSteps = user
    ? [
        "Go to Sites and register your domain",
        "Copy the tracking snippet and install it",
        "Open Activity to confirm first crawler events",
      ]
    : [
        "Create your account",
        "Register your first domain",
        "Install the snippet and verify events",
      ];

  return (
    <main className="shell px-4 py-8 md:px-6 md:py-12">
      <section className="panel overflow-hidden rounded-[2rem]">
        <div className="grid gap-10 px-6 py-8 md:grid-cols-[1.4fr_0.9fr] md:px-10 md:py-10">
          <div className="space-y-6">
            <div className="inline-flex rounded-full border border-[var(--border)] bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              AI Crawler Tracking and Analytics
            </div>

            <div className="space-y-4">
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] md:text-6xl">
                Understand exactly how AI bots crawl your site.
              </h1>

              <p className="max-w-2xl text-base leading-7 text-[var(--muted-foreground)] md:text-lg">
                Searchable tracks crawler events, attributes traffic to AI platforms, and turns raw bot activity into
                actionable analytics for your content and SEO workflow.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard/sites"
                    className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                  >
                    Register a site
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/70"
                  >
                    Open dashboard
                  </Link>
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/70"
                    >
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/signup"
                    className="rounded-full bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--accent-strong)]"
                  >
                    Start tracking now
                  </Link>
                  <Link
                    href="/login"
                    className="rounded-full border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white/70"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-[#243039] bg-[#0f1720] p-5 text-[#e7efeb] shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7be6b4]">First-run flow</span>
              <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{user ? user.email : "New workspace"}</span>
            </div>

            <div className="space-y-3 font-[family-name:var(--font-mono)] text-sm">
              {firstRunSteps.map((step, index) => (
                <div
                  key={step}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-[#e7efeb]"
                >
                  {index + 1}. {step}
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs leading-6 text-[#e1ece6]">
              Goal: go from zero to first verified crawler event with clear attribution to bot and platform.
            </p>
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

