import { DashboardAnalyticsFilters } from "@/components/dashboard-analytics-filters";
import { PageBreakdownLeaderboard } from "@/components/page-breakdown-leaderboard";
import {
  ActivityTrend,
  AnalyticsScope,
  DashboardNotice,
  PageVolumePanel,
  SectionHeading,
} from "@/components/dashboard-sections";
import {
  getDashboardData,
  normalizeDashboardFilterValue,
  resolveDashboardDateRange,
  resolveDashboardTrafficScope,
} from "@/lib/dashboard";

type DashboardPagesPageProps = {
  searchParams: Promise<{
    botType?: string;
    error?: string;
    message?: string;
    traffic?: string;
    platform?: string;
    range?: string;
    site?: string;
  }>;
};

export default async function DashboardPagesPage({
  searchParams,
}: DashboardPagesPageProps) {
  const { site, range, platform, botType, traffic, error, message } = await searchParams;
  const data = await getDashboardData({
    siteId: site,
    dateRange: resolveDashboardDateRange(range),
    trafficScope: resolveDashboardTrafficScope(traffic),
    platform: normalizeDashboardFilterValue(platform),
    botType: normalizeDashboardFilterValue(botType),
  });
  const totalVisits = data.topPages.reduce((sum, page) => sum + page.visits, 0);
  const topPage = data.topPages[0];

  return (
    <div className="space-y-6">
      <DashboardNotice message={message} error={error} />
      <AnalyticsScope sites={data.sites} selectedSiteId={data.selectedSiteId} />
      <DashboardAnalyticsFilters
        selectedDateRange={data.filters.dateRange}
        trafficScope={data.filters.trafficScope}
        selectedPlatform={data.filters.selectedPlatform}
        selectedBotType={data.filters.selectedBotType}
        platforms={data.filters.availablePlatforms}
        botTypes={data.filters.availableBotTypes}
      />

      <section className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Pages"
            title="Top pages visited by AI crawlers"
            description="Ranking of pages by crawler visits, using the same filters applied across all dashboard views."
            meta={`${data.topPages.length} ranked pages / ${totalVisits} visits`}
          />
          <PageVolumePanel pages={data.topPages} limit={8} />
          <div className="mt-5">
            <PageBreakdownLeaderboard pages={data.topPages} events={data.events} />
          </div>
        </article>

        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Coverage"
            title="Crawl coverage summary"
            description="Quick summary to help identify high-value content getting crawler attention."
            meta={topPage ? `${topPage.path} is currently #1` : "No page activity yet"}
          />

          <div className="grid gap-3">
            {[
              {
                label: "Unique pages touched",
                value: String(data.topPages.length),
                detail: "Distinct page paths observed in filtered events",
              },
              {
                label: "Top page visits",
                value: String(topPage?.visits ?? 0),
                detail: topPage
                  ? `${Math.round((topPage.visits / Math.max(totalVisits, 1)) * 100)}% of tracked visits`
                  : "No top page yet",
              },
              {
                label: "Tracked domains",
                value: String(data.sitesInView.length),
                detail: data.selectedSite ? `Focused on ${data.selectedSite.domain}` : "Combined site scope",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {item.label}
                </p>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{item.value}</p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section>
        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Trend"
            title="Page crawl trend"
            description="Timeline view for crawler page coverage within the selected date window."
          />
          <ActivityTrend
            points={data.timeline}
            caption={`Showing ${data.filters.dateRange.toUpperCase()} volume trend for page activity.`}
          />
        </article>
      </section>
    </div>
  );
}
