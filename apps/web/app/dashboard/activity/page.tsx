import { DashboardAnalyticsFilters } from "@/components/dashboard-analytics-filters";
import {
  ActivityFeed,
  ActivityTable,
  ActivityTrend,
  AnalyticsScope,
  SectionHeading,
} from "@/components/dashboard-sections";
import {
  getDashboardData,
  normalizeDashboardFilterValue,
  resolveDashboardDateRange,
  resolveDashboardTrafficScope,
} from "@/lib/dashboard";

type DashboardActivityPageProps = {
  searchParams: Promise<{
    botType?: string;
    traffic?: string;
    platform?: string;
    range?: string;
    site?: string;
    view?: string;
  }>;
};

export default async function DashboardActivityPage({
  searchParams,
}: DashboardActivityPageProps) {
  const { site, range, platform, botType, traffic, view } = await searchParams;
  const selectedView = view === "table" ? "table" : "feed";
  const data = await getDashboardData({
    siteId: site,
    dateRange: resolveDashboardDateRange(range),
    trafficScope: resolveDashboardTrafficScope(traffic),
    platform: normalizeDashboardFilterValue(platform),
    botType: normalizeDashboardFilterValue(botType),
  });
  const exportParams = new URLSearchParams();
  if (site) exportParams.set("site", site);
  if (range) exportParams.set("range", range);
  if (platform) exportParams.set("platform", platform);
  if (botType) exportParams.set("botType", botType);
  if (traffic) exportParams.set("traffic", traffic);
  if (selectedView === "table") exportParams.set("view", "table");
  const exportHref = `/dashboard/activity/export${exportParams.toString() ? `?${exportParams.toString()}` : ""}`;

  const viewParams = new URLSearchParams(exportParams.toString());
  viewParams.delete("view");
  const feedHref = `/dashboard/activity${viewParams.toString() ? `?${viewParams.toString()}` : ""}`;
  viewParams.set("view", "table");
  const tableHref = `/dashboard/activity?${viewParams.toString()}`;

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

      <section>
        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Trend"
            title="Crawler activity over time"
            description="Timeline view to track movement and detect shifts in crawler behavior."
          />
          <ActivityTrend
            points={data.timeline}
            caption={`Showing ${data.filters.dateRange.toUpperCase()} trend for ${data.filters.selectedPlatform ?? "all platforms"} and ${data.filters.selectedBotType ?? "all bot types"}.`}
          />
        </article>
      </section>

      <section>
        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Activity"
            title="Recent crawler activity log"
            description="Event log with filterable scope by date range, platform, and bot type."
            meta={`${data.events.length} events in filtered view`}
          />
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-full border border-[var(--border)] bg-white/75 p-1">
              <a
                href={feedHref}
                className={[
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                  selectedView === "feed"
                    ? "bg-[var(--accent)] text-[#0a1014]"
                    : "text-[var(--foreground)] hover:bg-white",
                ].join(" ")}
              >
                Feed
              </a>
              <a
                href={tableHref}
                className={[
                  "rounded-full px-3 py-1.5 text-sm font-semibold transition",
                  selectedView === "table"
                    ? "bg-[var(--accent)] text-[#0a1014]"
                    : "text-[var(--foreground)] hover:bg-white",
                ].join(" ")}
              >
                Table
              </a>
            </div>
            <a
              href={exportHref}
              className="inline-flex items-center rounded-full border border-[var(--border)] bg-white/75 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
            >
              Export CSV
            </a>
          </div>
          {selectedView === "table" ? <ActivityTable events={data.events} /> : <ActivityFeed events={data.events} />}
        </article>
      </section>
    </div>
  );
}
