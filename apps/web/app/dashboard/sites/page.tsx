import Link from "next/link";

import {
  SectionHeading,
  SiteList,
  SiteRegistrationCard,
  SiteSnapshotCards,
} from "@/components/dashboard-sections";
import { env } from "@/lib/env";
import { formatRelativeDays, getDashboardData } from "@/lib/dashboard";

export default async function DashboardSitesPage() {
  const data = await getDashboardData();
  const featuredSite = data.sites[0] ?? null;

  return (
    <div className="space-y-6">
      <section>
        <SectionHeading
          eyebrow="Sites"
          title="Manage owned domains and deployment readiness"
          description="This is the operational home for the product: create domains, inspect ownership state, and hand off the exact install code your team needs to deploy tracking."
          meta={`${data.sites.length} registered domains`}
        />
        <SiteSnapshotCards sites={data.sites} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Inventory"
            title="All registered sites"
            description="A clear operational list of every domain in the workspace, with onboarding status and token access for deployment."
            meta="Source of truth for domains"
          />
          <SiteList sites={data.sites} supabaseUrl={env.NEXT_PUBLIC_SUPABASE_URL} />
        </article>

        <div className="grid gap-4">
          <SiteRegistrationCard />

          <article className="panel rounded-[1.5rem] p-5">
            <SectionHeading
              eyebrow="Focus"
              title={featuredSite ? featuredSite.name || featuredSite.domain : "Your next site"}
              description={
                featuredSite
                  ? "The most recently added domain is a good candidate for installation and first-event verification."
                  : "Create a site to generate deployable code and start validating the tracking pipeline."
              }
              meta={featuredSite ? `Added ${formatRelativeDays(featuredSite.created_at)}` : "No sites yet"}
            />

            {featuredSite ? (
              <div className="grid gap-3">
                {[
                  {
                    label: "Domain",
                    value: featuredSite.domain,
                  },
                  {
                    label: "Verification",
                    value: featuredSite.verified_at ? "Complete" : "Pending",
                  },
                  {
                    label: "Install status",
                    value: "Script and pixel ready",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-base font-semibold">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-5 text-sm leading-7 text-[var(--muted-foreground)]">
                The first created site will appear here with a tighter operational summary and quick
                install context.
              </div>
            )}
          </article>
        </div>
      </section>

      <section>
        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Workflow"
            title="Install is now in the site list"
            description="Use the Install button on any site row to open a focused deployment dialog with copyable script, pixel fallback, and token."
            meta="Faster operator workflow"
          />
          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/activity"
              className="rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              Validate recent activity
            </Link>
            <Link
              href="/dashboard/settings"
              className="rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              Open workspace settings
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
