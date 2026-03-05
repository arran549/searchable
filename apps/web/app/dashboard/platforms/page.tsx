import { DashboardAnalyticsFilters } from "@/components/dashboard-analytics-filters";
import { ActivityTrend, AnalyticsScope, PlatformPanel, SectionHeading } from "@/components/dashboard-sections";
import {
  getDashboardData,
  normalizeDashboardFilterValue,
  resolveDashboardDateRange,
  resolveDashboardTrafficScope,
} from "@/lib/dashboard";

type DashboardPlatformsPageProps = {
  searchParams: Promise<{
    botType?: string;
    traffic?: string;
    platform?: string;
    range?: string;
    site?: string;
  }>;
};

export default async function DashboardPlatformsPage({
  searchParams,
}: DashboardPlatformsPageProps) {
  const { site, range, platform, botType, traffic } = await searchParams;
  const data = await getDashboardData({
    siteId: site,
    dateRange: resolveDashboardDateRange(range),
    trafficScope: resolveDashboardTrafficScope(traffic),
    platform: normalizeDashboardFilterValue(platform),
    botType: normalizeDashboardFilterValue(botType),
  });
  const totalVisits = data.platformCounts.reduce((sum, item) => sum + item.visits, 0);
  const topPlatform = data.platformCounts[0];

  return (
    <div className="space-y-6">
      <AnalyticsScope sites={data.sites} selectedSiteId={data.selectedSiteId} />
      <DashboardAnalyticsFilters
        selectedDateRange={data.filters.dateRange}
        trafficScope={data.filters.trafficScope}
        selectedPlatform={data.filters.selectedPlatform}
        selectedBotType={data.filters.selectedBotType}
        platforms={data.filters.availablePlatforms}
        botTypes={data.filters.availableBotTypes}
      />

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Platforms"
            title="Breakdown of crawler visits by AI platform"
            description="Use this distribution to validate platform coverage and concentration for your selected time window."
            meta={`${totalVisits} visits / ${data.platformCounts.length} platforms`}
          />
          <PlatformPanel platforms={data.platformCounts} />
        </article>

        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Snapshot"
            title="Current platform readout"
            description="High-level summary for PRD user story US-1: who is crawling and how concentrated the mix is."
          />

          <div className="grid gap-3">
            {[
              {
                label: "Top platform",
                value: topPlatform?.name ?? "No data yet",
                detail: topPlatform
                  ? `${topPlatform.visits} visits (${Math.round((topPlatform.visits / Math.max(totalVisits, 1)) * 100)}% share)`
                  : "Install a tracker to start collecting data",
              },
              {
                label: "Filter scope",
                value: data.filters.dateRange.toUpperCase(),
                detail: `${data.filters.unfilteredCount} events match site + date filters`,
              },
              {
                label: "Platform diversity",
                value: String(data.platformCounts.length),
                detail:
                  data.platformCounts.length > 2
                    ? "Healthy spread across known bot families"
                    : "Still early signal, not broad coverage yet",
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
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel rounded-[1.5rem] p-5">
        <SectionHeading
          eyebrow="Trend"
          title="Crawler activity trend over time"
          description="Timeline for FR-3.4, reflecting the same platform and bot filters currently applied."
        />
        <ActivityTrend
          points={data.timeline}
          caption={`Showing ${data.filters.dateRange.toUpperCase()} trend for ${data.filters.selectedPlatform ?? "all platforms"} and ${data.filters.selectedBotType ?? "all bot types"}.`}
        />
      </section>
    </div>
  );
}
