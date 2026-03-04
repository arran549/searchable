import { redirect } from "next/navigation";

import { createSiteAction } from "@/app/dashboard/actions";
import { signOutAction } from "@/app/auth/actions";
import { AuthSubmitButton } from "@/components/auth-submit-button";
import { env } from "@/lib/env";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getPixelInstallSnippet, getScriptInstallSnippet } from "@/lib/tracking-snippets";

const platformTints = [
  "bg-[#c7652b]",
  "bg-[#156a56]",
  "bg-[#1f4f85]",
  "bg-[#6f4d8d]",
  "bg-[#7d5b2f]",
];

type DashboardPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const { error, message } = await searchParams;
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20log%20in%20to%20access%20the%20dashboard");
  }

  const [{ data: sites, error: sitesError }, { data: events, error: eventsError }] =
    await Promise.all([
      supabase
        .from("sites")
        .select("id, domain, name, tracking_token, verification_token, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("crawler_events")
        .select("id, occurred_at, page_path, page_url, platform, bot_name, bot_type, source")
        .order("occurred_at", { ascending: false })
        .limit(50),
    ]);

  const safeSites = sitesError ? [] : (sites ?? []);
  const safeEvents = eventsError ? [] : (events ?? []);

  const stats = [
    { label: "Tracked sites", value: String(safeSites.length), detail: "Registered domains" },
    { label: "Crawler events", value: String(safeEvents.length), detail: "Latest 50 events" },
    {
      label: "Known platforms",
      value: String(new Set(safeEvents.map((event) => event.platform)).size),
      detail: "Distinct platforms detected",
    },
  ];

  const platformCounts = Array.from(
    safeEvents.reduce((accumulator, event) => {
      const key = event.platform || "Unknown";
      accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
      return accumulator;
    }, new Map<string, number>()),
  )
    .map(([name, visits], index) => ({
      name,
      visits,
      tint: platformTints[index % platformTints.length],
    }))
    .sort((left, right) => right.visits - left.visits)
    .slice(0, 5);

  const topPlatformVisits = platformCounts[0]?.visits ?? 1;

  const topPages = Array.from(
    safeEvents.reduce((accumulator, event) => {
      const key = event.page_path || event.page_url;
      const current = accumulator.get(key) ?? {
        path: key,
        visits: 0,
        bot: event.bot_name || "Unknown",
      };

      current.visits += 1;
      accumulator.set(key, current);
      return accumulator;
    }, new Map<string, { path: string; visits: number; bot: string }>()),
  )
    .map(([, value]) => value)
    .sort((left, right) => right.visits - left.visits)
    .slice(0, 5);

  return (
    <main className="shell px-4 py-8 md:px-6 md:py-12">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Dashboard starter
          </p>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] md:text-5xl">
            Replace the mock data with your Supabase queries.
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-full border border-[var(--border)] bg-white/60 px-4 py-2 text-sm text-[var(--muted-foreground)]">
            Signed in as {user.email}
          </div>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-full border border-[var(--border)] bg-white/60 px-4 py-2 text-sm font-semibold transition hover:bg-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {message ? (
        <div className="mb-4 rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-2xl border border-[#cf6f2e] bg-[#fff4ea] px-4 py-3 text-sm text-[#9d4511]">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="panel rounded-[1.5rem] p-5">
            <p className="mb-2 text-sm text-[var(--muted-foreground)]">{stat.label}</p>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-[-0.03em]">{stat.value}</p>
              <p className="text-sm font-medium text-[var(--success)]">{stat.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="panel rounded-[1.5rem] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Register a site</h2>
            <span className="text-sm text-[var(--muted-foreground)]">Required before install</span>
          </div>

          <form action={createSiteAction} className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium">Domain</span>
              <input
                required
                name="domain"
                placeholder="example.com"
                className="w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium">Label</span>
              <input
                name="name"
                placeholder="Marketing site"
                className="w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
              />
            </label>

            <AuthSubmitButton idleLabel="Create site" pendingLabel="Creating..." />
          </form>

          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white/55 p-4 text-sm text-[var(--muted-foreground)]">
            The PRD flow is: sign up, register a site, generate a tokenized snippet, then install
            it on the target website.
          </div>
        </article>

        <article className="panel rounded-[1.5rem] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Platform split</h2>
            <span className="text-sm text-[var(--muted-foreground)]">Latest events</span>
          </div>

          {platformCounts.length ? (
            <div className="space-y-3">
              {platformCounts.map((platform) => (
                <div key={platform.name} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>{platform.name}</span>
                    <span className="text-[var(--muted-foreground)]">{platform.visits} visits</span>
                  </div>
                  <div className="h-3 rounded-full bg-black/5">
                    <div
                      className={`h-3 rounded-full ${platform.tint}`}
                      style={{ width: `${(platform.visits / topPlatformVisits) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No crawler events yet. Install a snippet on one of your sites and trigger a test
              event.
            </p>
          )}
        </article>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="panel rounded-[1.5rem] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Registered sites</h2>
            <span className="text-sm text-[var(--muted-foreground)]">{safeSites.length} total</span>
          </div>

          {safeSites.length ? (
            <div className="space-y-4">
              {safeSites.map((site) => (
                <div key={site.id} className="rounded-2xl border border-[var(--border)] p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold">{site.name || site.domain}</p>
                      <p className="text-sm text-[var(--muted-foreground)]">{site.domain}</p>
                    </div>
                    <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                      token ready
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        Script install
                      </p>
                      <pre className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white/60 p-3 text-xs leading-6">
                        <code>
                          {getScriptInstallSnippet(env.NEXT_PUBLIC_SUPABASE_URL, site.tracking_token)}
                        </code>
                      </pre>
                    </div>

                    <div>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                        HTML pixel fallback
                      </p>
                      <pre className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white/60 p-3 text-xs leading-6">
                        <code>
                          {getPixelInstallSnippet(env.NEXT_PUBLIC_SUPABASE_URL, site.tracking_token)}
                        </code>
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No sites registered yet. Create one above to generate the install snippets.
            </p>
          )}
        </article>

        <article className="panel rounded-[1.5rem] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Top pages</h2>
            <span className="text-sm text-[var(--muted-foreground)]">Real events</span>
          </div>

          {topPages.length ? (
            <div className="space-y-3">
              {topPages.map((page) => (
                <div key={page.path} className="rounded-2xl border border-[var(--border)] p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <code className="text-sm font-medium">{page.path}</code>
                    <span className="text-sm text-[var(--muted-foreground)]">{page.visits}</span>
                  </div>
                  <p className="text-sm text-[var(--muted-foreground)]">
                    Most recent dominant crawler: {page.bot}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              No events yet. Use the Bruno request or install one of the generated snippets to
              populate this view.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
