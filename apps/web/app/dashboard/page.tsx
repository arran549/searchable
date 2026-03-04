import Link from "next/link";

import {
  ActivityFeed,
  AnalyticsScope,
  DashboardNotice,
  PageLeaderboard,
  PlatformPanel,
  SectionHeading,
  SiteRegistrationCard,
  StatsGrid,
} from "@/components/dashboard-sections";
import { getDashboardData } from "@/lib/dashboard";

type DashboardOverviewPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    site?: string;
  }>;
};

export default async function DashboardOverviewPage({
  searchParams,
}: DashboardOverviewPageProps) {
  const { error, message, site } = await searchParams;
  const data = await getDashboardData({ siteId: site });

  return (
    <div className="space-y-6">
      <DashboardNotice message={message} error={error} />
      <AnalyticsScope sites={data.sites} selectedSiteId={data.selectedSiteId} />

      <section>
        <SectionHeading
          eyebrow="Overview"
          title="Product signal, not placeholder stats."
          description="This view gives you the full story in one scan: tracked domains, event volume, platform spread, and the latest crawler activity."
          meta={data.latestEventLabel}
        />
        <StatsGrid stats={data.stats} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.88fr_1.12fr]">
        <SiteRegistrationCard />

        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Platforms"
            title="Who is touching your content?"
            description="A ranked view of the platforms surfacing most often across your tracked events."
            meta="Last 250 events"
          />
          <PlatformPanel platforms={data.platformCounts} limit={5} />
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Pages"
            title="Top pages crawled"
            description="The most frequently touched URLs across your registered sites."
            meta="Ranked by event count"
          />
          <PageLeaderboard pages={data.topPages} limit={6} />
          <div className="mt-4">
            <Link
              href="/dashboard/pages"
              className="text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
            >
              Open full page leaderboard
            </Link>
          </div>
        </article>

        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Activity"
            title="Recent crawler log"
            description="The latest crawler events with user-agent context for quick validation."
            meta="Latest 6 events"
          />
          <ActivityFeed events={data.recentActivity} limit={6} />
          <div className="mt-4">
            <Link
              href="/dashboard/activity"
              className="text-sm font-semibold text-[var(--accent-strong)] transition hover:text-[var(--accent)]"
            >
              Open full activity view
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
