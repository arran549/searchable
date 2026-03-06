import { redirect } from "next/navigation";

import type { Database } from "@/lib/database.types";
import { getServerSupabaseClient } from "@/lib/supabase/server";

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
type EventRow = Database["public"]["Tables"]["crawler_events"]["Row"];

const platformTints = [
  "bg-[#c7652b]",
  "bg-[#156a56]",
  "bg-[#1f4f85]",
  "bg-[#6f4d8d]",
  "bg-[#7d5b2f]",
];

export type DashboardSite = Pick<
  SiteRow,
  | "id"
  | "domain"
  | "name"
  | "tracking_token"
  | "verification_token"
  | "created_at"
  | "verified_at"
  | "log_non_ai_traffic"
> & {
  latest_event_at: string | null;
};

export type DashboardEvent = Pick<
  EventRow,
  | "id"
  | "site_id"
  | "occurred_at"
  | "page_path"
  | "page_url"
  | "platform"
  | "bot_name"
  | "bot_type"
  | "source"
  | "user_agent"
>;

export type DashboardPlatform = {
  name: string;
  visits: number;
  tint: string;
};

export type DashboardPageSummary = {
  path: string;
  site: string;
  visits: number;
  bot: string;
  platform: string;
};

export const dashboardDateRanges = ["24h", "7d", "30d"] as const;
export type DashboardDateRange = (typeof dashboardDateRanges)[number];
export const dashboardTrafficScopes = ["ai", "all"] as const;
export type DashboardTrafficScope = (typeof dashboardTrafficScopes)[number];

export type DashboardTimelinePoint = {
  label: string;
  visits: number;
  platformVisits: Record<string, number>;
};

type DashboardDataOptions = {
  siteId?: string;
  dateRange?: DashboardDateRange;
  platform?: string;
  botType?: string;
  trafficScope?: DashboardTrafficScope;
  eventLimit?: number;
};

export function resolveDashboardDateRange(value?: string): DashboardDateRange {
  if (!value) {
    return "7d";
  }

  return dashboardDateRanges.includes(value as DashboardDateRange) ? (value as DashboardDateRange) : "7d";
}

export function normalizeDashboardFilterValue(value?: string) {
  if (!value || value === "all") {
    return undefined;
  }

  return value;
}

export function resolveDashboardTrafficScope(value?: string): DashboardTrafficScope {
  if (!value) {
    return "ai";
  }

  return dashboardTrafficScopes.includes(value as DashboardTrafficScope)
    ? (value as DashboardTrafficScope)
    : "ai";
}

export async function requireDashboardSession() {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20log%20in%20to%20access%20the%20dashboard");
  }

  return { supabase, user };
}

export async function getDashboardData(options: DashboardDataOptions = {}) {
  const { supabase, user } = await requireDashboardSession();
  const dateRange = resolveDashboardDateRange(options.dateRange);
  const selectedPlatform = normalizeDashboardFilterValue(options.platform);
  const selectedBotType = normalizeDashboardFilterValue(options.botType);
  const trafficScope = resolveDashboardTrafficScope(options.trafficScope);
  const eventLimit = options.eventLimit ?? 1000;
  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("id, domain, name, tracking_token, verification_token, created_at, verified_at, log_non_ai_traffic")
    .order("created_at", { ascending: false });

  const safeSiteRows = sitesError ? [] : ((sites ?? []) as SiteRow[]);
  const latestEventBySiteId = new Map<string, string>();

  if (safeSiteRows.length) {
    const siteIds = safeSiteRows.map((site) => site.id);
    const { data: siteEvents, error: siteEventsError } = await supabase
      .from("crawler_events")
      .select("site_id, occurred_at")
      .in("site_id", siteIds)
      .order("occurred_at", { ascending: false })
      .limit(5000);

    if (!siteEventsError) {
      for (const event of (siteEvents ?? []) as Array<Pick<EventRow, "site_id" | "occurred_at">>) {
        if (!latestEventBySiteId.has(event.site_id)) {
          latestEventBySiteId.set(event.site_id, event.occurred_at);
        }
      }
    }
  }

  const safeSites: DashboardSite[] = safeSiteRows.map((site) => ({
    ...site,
    latest_event_at: latestEventBySiteId.get(site.id) ?? null,
  }));
  const selectedSiteId = options.siteId && safeSites.some((site) => site.id === options.siteId)
    ? options.siteId
    : undefined;
  const selectedSite = selectedSiteId ? safeSites.find((site) => site.id === selectedSiteId) ?? null : null;

  let eventsQuery = supabase
    .from("crawler_events")
    .select("id, site_id, occurred_at, page_path, page_url, platform, bot_name, bot_type, source, user_agent")
    .order("occurred_at", { ascending: false })
    .gte("occurred_at", getDateRangeStartIso(dateRange))
    .limit(eventLimit);

  if (selectedSiteId) {
    eventsQuery = eventsQuery.eq("site_id", selectedSiteId);
  }

  const { data: events, error: eventsError } = await eventsQuery;
  const baseEvents = eventsError ? [] : ((events ?? []) as DashboardEvent[]);
  const safeEvents = baseEvents.filter((event) => {
    if (trafficScope === "ai" && event.bot_type === "non_ai") {
      return false;
    }

    if (selectedPlatform && event.platform !== selectedPlatform) {
      return false;
    }

    if (selectedBotType && event.bot_type !== selectedBotType) {
      return false;
    }

    return true;
  });
  const sitesInView = selectedSite ? [selectedSite] : safeSites;

  const distinctPlatforms = new Set(safeEvents.map((event) => event.platform)).size;
  const distinctPages = new Set(safeEvents.map((event) => event.page_path || event.page_url)).size;
  const recentEvent = safeEvents[0] ?? null;

  const stats = [
    {
      label: "Sites in view",
      value: String(sitesInView.length),
      detail: selectedSite
        ? `Filtered to ${selectedSite.domain}`
        : safeSites.length
          ? "All registered domains"
          : "Create your first site",
    },
    {
      label: "Crawler events",
      value: String(safeEvents.length),
      detail: recentEvent
        ? `Last seen ${formatRelativeDays(recentEvent.occurred_at)} (${dateRange} view)`
        : `No events in ${dateRange} view`,
    },
    {
      label: "Known platforms",
      value: String(distinctPlatforms),
      detail: distinctPlatforms ? "Distinct bot platforms detected" : "Waiting for tracking data",
    },
    {
      label: "Pages touched",
      value: String(distinctPages),
      detail: distinctPages ? "Unique paths visited by crawlers" : "No page activity yet",
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
    .sort((left, right) => right.visits - left.visits);

  const topPages = Array.from(
    safeEvents.reduce((accumulator, event) => {
      const key = event.page_path || event.page_url;
      const siteId = event.site_id;
      const current = accumulator.get(key) ?? {
        path: key,
        siteCounts: new Map<string, number>(),
        visits: 0,
        bot: event.bot_name || "Unknown",
        platform: event.platform || "Unknown",
      };

      current.visits += 1;
      current.bot = event.bot_name || current.bot;
      current.platform = event.platform || current.platform;
      current.siteCounts.set(siteId, (current.siteCounts.get(siteId) ?? 0) + 1);
      accumulator.set(key, current);
      return accumulator;
    }, new Map<string, {
      path: string;
      siteCounts: Map<string, number>;
      visits: number;
      bot: string;
      platform: string;
    }>()),
  )
    .map(([, value]) => {
      const rankedSites = Array.from(value.siteCounts.entries()).sort((left, right) => right[1] - left[1]);
      const topSiteId = rankedSites[0]?.[0];
      const topSite = safeSites.find((site) => site.id === topSiteId);
      const topSiteLabel = topSite?.name || topSite?.domain || "Unknown site";
      const site = rankedSites.length > 1 ? `${topSiteLabel} (+${rankedSites.length - 1} more)` : topSiteLabel;

      return {
        path: value.path,
        site,
        visits: value.visits,
        bot: value.bot,
        platform: value.platform,
      };
    })
    .sort((left, right) => right.visits - left.visits);

  const availablePlatforms = Array.from(
    new Set(
      baseEvents
        .filter((event) => trafficScope === "all" || event.bot_type !== "non_ai")
        .map((event) => event.platform)
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const availableBotTypes = Array.from(
    new Set(
      baseEvents
        .filter((event) => trafficScope === "all" || event.bot_type !== "non_ai")
        .map((event) => event.bot_type)
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));
  const timeline = buildTimeline(safeEvents, dateRange);

  return {
    user,
    sites: safeSites,
    sitesInView,
    selectedSiteId,
    selectedSite,
    events: safeEvents,
    stats,
    platformCounts,
    topPages,
    timeline,
    recentActivity: safeEvents.slice(0, 12),
    latestEventLabel: recentEvent ? `Latest event ${formatRelativeDays(recentEvent.occurred_at)}` : "No activity yet",
    filters: {
      dateRange,
      selectedPlatform,
      selectedBotType,
      trafficScope,
      availablePlatforms,
      availableBotTypes,
      unfilteredCount: baseEvents.length,
    },
  };
}

export function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeDays(value: string) {
  const now = new Date();
  const target = new Date(value);
  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const diffDays = Math.floor((nowDay - targetDay) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "today";
  }

  if (diffDays === 1) {
    return "1 day ago";
  }

  if (diffDays < 0) {
    return `in ${Math.abs(diffDays)} days`;
  }

  return `${diffDays} days ago`;
}

export function stripProtocol(value: string) {
  return value.replace(/^https?:\/\//i, "");
}

function getDateRangeStartIso(dateRange: DashboardDateRange) {
  const now = Date.now();
  const windowMs = dateRange === "24h" ? 24 * 60 * 60 * 1000 : dateRange === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;

  return new Date(now - windowMs).toISOString();
}

function buildTimeline(events: DashboardEvent[], dateRange: DashboardDateRange): DashboardTimelinePoint[] {
  const now = new Date();
  const buckets: Array<{ start: Date; label: string }> = [];

  if (dateRange === "24h") {
    for (let offset = 23; offset >= 0; offset -= 1) {
      const start = new Date(now);
      start.setMinutes(0, 0, 0);
      start.setHours(start.getHours() - offset);
      buckets.push({
        start,
        label: start.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
      });
    }
  } else {
    const dayCount = dateRange === "7d" ? 7 : 30;
    for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - offset);
      buckets.push({
        start,
        label: start.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
      });
    }
  }

  return buckets.map((bucket, index) => {
    const nextStart = buckets[index + 1]?.start ?? now;
    const bucketCounts = events.reduce(
      (accumulator, event) => {
        const occurredAt = new Date(event.occurred_at).getTime();
        const startsAt = bucket.start.getTime();
        const endsAt = nextStart.getTime();
        const inBucket = index === buckets.length - 1
          ? occurredAt >= startsAt
          : occurredAt >= startsAt && occurredAt < endsAt;
        if (!inBucket) {
          return accumulator;
        }

        const platform = event.platform || "Unknown";
        return {
          visits: accumulator.visits + 1,
          platformVisits: {
            ...accumulator.platformVisits,
            [platform]: (accumulator.platformVisits[platform] ?? 0) + 1,
          },
        };
      },
      {
        visits: 0,
        platformVisits: {} as Record<string, number>,
      },
    );

    return {
      label: bucket.label,
      visits: bucketCounts.visits,
      platformVisits: bucketCounts.platformVisits,
    };
  });
}
