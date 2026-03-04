import { DashboardAnalyticsFilters } from "@/components/dashboard-analytics-filters";
import { ActivityFeed, ActivityTrend, AnalyticsScope, SectionHeading } from "@/components/dashboard-sections";
import { getDashboardData, normalizeDashboardFilterValue, resolveDashboardDateRange } from "@/lib/dashboard";

type DashboardActivityPageProps = {
  searchParams: Promise<{
    botType?: string;
    platform?: string;
    range?: string;
    site?: string;
  }>;
};

export default async function DashboardActivityPage({
  searchParams,
}: DashboardActivityPageProps) {
  const { site, range, platform, botType } = await searchParams;
  const data = await getDashboardData({
    siteId: site,
    dateRange: resolveDashboardDateRange(range),
    platform: normalizeDashboardFilterValue(platform),
    botType: normalizeDashboardFilterValue(botType),
  });
  const exportParams = new URLSearchParams();
  if (site) exportParams.set("site", site);
  if (range) exportParams.set("range", range);
  if (platform) exportParams.set("platform", platform);
  if (botType) exportParams.set("botType", botType);
  const exportHref = `/dashboard/activity/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  return (
    <div className="space-y-6">
      <AnalyticsScope sites={data.sites} selectedSiteId={data.selectedSiteId} />
      <DashboardAnalyticsFilters
        selectedDateRange={data.filters.dateRange}
        selectedPlatform={data.filters.selectedPlatform}
        selectedBotType={data.filters.selectedBotType}
        platforms={data.filters.availablePlatforms}
        botTypes={data.filters.availableBotTypes}
      />

      <section className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Activity"
            title="Recent crawler activity log"
            description="PRD FR-3.6 event log with filterable scope by date range, platform, and bot type."
            meta={`${data.events.length} events in filtered view`}
          />
          <div className="mb-4">
            <a
              href={exportHref}
              className="inline-flex items-center rounded-full border border-[var(--border)] bg-white/75 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              Export CSV
            </a>
          </div>
          <ActivityFeed events={data.events} />
        </article>

        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Trend"
            title="Crawler activity over time"
            description="Timeline view to track movement and detect shifts in crawler behavior (US-3)."
          />
          <ActivityTrend
            points={data.timeline}
            caption={`Showing ${data.filters.dateRange.toUpperCase()} trend for ${data.filters.selectedPlatform ?? "all platforms"} and ${data.filters.selectedBotType ?? "all bot types"}.`}
          />
        </article>
      </section>
    </div>
  );
}
