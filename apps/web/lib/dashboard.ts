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
  "id" | "domain" | "name" | "tracking_token" | "verification_token" | "created_at" | "verified_at"
>;

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
  visits: number;
  bot: string;
  platform: string;
};

export const dashboardDateRanges = ["24h", "7d", "30d"] as const;
export type DashboardDateRange = (typeof dashboardDateRanges)[number];

export type DashboardTimelinePoint = {
  label: string;
  visits: number;
};

type DashboardDataOptions = {
  siteId?: string;
  dateRange?: DashboardDateRange;
  platform?: string;
  botType?: string;
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
  const eventLimit = options.eventLimit ?? 1000;
  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("id, domain, name, tracking_token, verification_token, created_at, verified_at")
    .order("created_at", { ascending: false });

  const safeSites = sitesError ? [] : ((sites ?? []) as DashboardSite[]);
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
      const current = accumulator.get(key) ?? {
        path: key,
        visits: 0,
        bot: event.bot_name || "Unknown",
        platform: event.platform || "Unknown",
      };

      current.visits += 1;
      current.bot = event.bot_name || current.bot;
      current.platform = event.platform || current.platform;
      accumulator.set(key, current);
      return accumulator;
    }, new Map<string, DashboardPageSummary>()),
  )
    .map(([, value]) => value)
    .sort((left, right) => right.visits - left.visits);

  const availablePlatforms = Array.from(
    new Set(baseEvents.map((event) => event.platform).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
  const availableBotTypes = Array.from(
    new Set(baseEvents.map((event) => event.bot_type).filter(Boolean)),
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
  const diffMs = Date.now() - new Date(value).getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) {
    return "today";
  }

  if (diffDays === 1) {
    return "1 day ago";
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
    const visits = events.reduce((count, event) => {
      const occurredAt = new Date(event.occurred_at).getTime();
      const startsAt = bucket.start.getTime();
      const endsAt = nextStart.getTime();
      if (index === buckets.length - 1) {
        return occurredAt >= startsAt ? count + 1 : count;
      }

      return occurredAt >= startsAt && occurredAt < endsAt ? count + 1 : count;
    }, 0);

    return {
      label: bucket.label,
      visits,
    };
  });
}
