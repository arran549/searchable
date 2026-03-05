import Link from "next/link";

import {
  DashboardNotice,
  SectionHeading,
  SiteList,
  SiteRegistrationCard,
  SiteSnapshotCards,
} from "@/components/dashboard-sections";
import { SiteRegistrationDialog } from "@/components/site-registration-dialog";
import { env } from "@/lib/env";
import { formatRelativeDays, getDashboardData } from "@/lib/dashboard";

type DashboardSitesPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    onboarding?: string;
  }>;
};

export default async function DashboardSitesPage({
  searchParams,
}: DashboardSitesPageProps) {
  const { onboarding, error, message } = await searchParams;
  const data = await getDashboardData();
  const featuredSite = data.sites[0] ?? null;
  const showOnboarding = onboarding === "1";

  return (
    <div className="space-y-6">
      <DashboardNotice message={message} error={error} />
      <section>
        <SectionHeading
          eyebrow="Sites"
          title="Manage owned domains and deployment readiness"
          description="This is the operational home for the product: create domains, inspect ownership state, and hand off the exact install code your team needs to deploy tracking."
          meta={`${data.sites.length} registered domains`}
        />
        <SiteSnapshotCards sites={data.sites} />
      </section>

      {showOnboarding ? (
        <section className="panel rounded-[1.5rem] p-5 md:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                Onboarding
              </p>
              <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">
                Register a new site
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                Create a domain first, then install script or pixel tracking from the generated token.
              </p>
            </div>

            <Link
              href="/dashboard/sites"
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[#f8fbf9]"
            >
              Back to sites
            </Link>
          </div>

          <div className="mx-auto max-w-3xl">
            <SiteRegistrationCard />
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
            <article className="panel rounded-[1.5rem] p-5">
              <SectionHeading
                eyebrow="Inventory"
                title="All registered sites"
                description="A clear operational list of every domain in the workspace, with onboarding status and token access for deployment."
                meta="Source of truth for domains"
              />
              <SiteList
                sites={data.sites}
                supabaseUrl={env.NEXT_PUBLIC_SUPABASE_URL}
                returnTo="/dashboard/sites"
                noticeMessage={message}
                noticeError={error}
              />
            </article>

            <div className="grid gap-4">
              <article className="panel rounded-[1.5rem] p-5">
                <SectionHeading
                  eyebrow="Onboarding"
                  title="Register a new site"
                  description="Open a focused dialog to register domains without leaving the current operational view."
                  meta="Recommended first step"
                />
                <SiteRegistrationDialog />
              </article>

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
                description="Use the Install Tracking Code button on any site row to open a focused deployment dialog with copyable script, pixel fallback, and token."
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
        </>
      )}
    </div>
  );
}
