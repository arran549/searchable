import { redirect } from "next/navigation";

import { signOutAction } from "@/app/auth/actions";
import { getServerSupabaseClient } from "@/lib/supabase/server";

const stats = [
  { label: "Crawler visits", value: "1,284", delta: "+18%" },
  { label: "Tracked platforms", value: "7", delta: "+2" },
  { label: "Top page hits", value: "/docs/ai", delta: "312 visits" },
];

const platforms = [
  { name: "OpenAI", visits: 442, tint: "bg-[#c7652b]" },
  { name: "Anthropic", visits: 301, tint: "bg-[#156a56]" },
  { name: "Perplexity", visits: 269, tint: "bg-[#1f4f85]" },
  { name: "Meta", visits: 143, tint: "bg-[#6f4d8d]" },
];

const pages = [
  { path: "/docs/ai-crawlers", visits: 312, bot: "GPTBot" },
  { path: "/blog/llm-seo", visits: 206, bot: "ClaudeBot" },
  { path: "/pricing", visits: 119, bot: "PerplexityBot" },
];

export default async function DashboardPage() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20log%20in%20to%20access%20the%20dashboard");
  }

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

      <section className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <article key={stat.label} className="panel rounded-[1.5rem] p-5">
            <p className="mb-2 text-sm text-[var(--muted-foreground)]">{stat.label}</p>
            <div className="flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-[-0.03em]">{stat.value}</p>
              <p className="text-sm font-medium text-[var(--success)]">{stat.delta}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="panel rounded-[1.5rem] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Platform split</h2>
            <span className="text-sm text-[var(--muted-foreground)]">Last 7 days</span>
          </div>

          <div className="space-y-3">
            {platforms.map((platform) => (
              <div key={platform.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{platform.name}</span>
                  <span className="text-[var(--muted-foreground)]">{platform.visits} visits</span>
                </div>
                <div className="h-3 rounded-full bg-black/5">
                  <div
                    className={`h-3 rounded-full ${platform.tint}`}
                    style={{ width: `${(platform.visits / 442) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel rounded-[1.5rem] p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-[-0.03em]">Top pages</h2>
            <span className="text-sm text-[var(--muted-foreground)]">Mock data</span>
          </div>

          <div className="space-y-3">
            {pages.map((page) => (
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
        </article>
      </section>
    </main>
  );
}
