import { type NextRequest, NextResponse } from "next/server";

import {
  normalizeDashboardFilterValue,
  resolveDashboardDateRange,
  resolveDashboardTrafficScope,
} from "@/lib/dashboard";
import { getServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const range = resolveDashboardDateRange(request.nextUrl.searchParams.get("range") ?? undefined);
  const traffic = resolveDashboardTrafficScope(
    request.nextUrl.searchParams.get("traffic") ?? undefined,
  );
  const site = normalizeDashboardFilterValue(request.nextUrl.searchParams.get("site") ?? undefined);
  const platform = normalizeDashboardFilterValue(request.nextUrl.searchParams.get("platform") ?? undefined);
  const botType = normalizeDashboardFilterValue(request.nextUrl.searchParams.get("botType") ?? undefined);

  const events = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;
  let error: { message: string } | null = null;

  while (hasMore) {
    let query = supabase
      .from("crawler_events")
      .select("occurred_at, page_url, bot_name, platform, bot_type, user_agent")
      .gte("occurred_at", getDateRangeStartIso(range))
      .order("occurred_at", { ascending: false })
      .range(from, from + pageSize - 1);

    if (site) {
      query = query.eq("site_id", site);
    }
    if (platform) {
      query = query.eq("platform", platform);
    }
    if (botType) {
      query = query.eq("bot_type", botType);
    }
    if (traffic === "ai") {
      query = query.neq("bot_type", "non_ai");
    }

    const { data: page, error: pageError } = await query;

    if (pageError) {
      error = pageError;
      break;
    }

    if (!page?.length) {
      hasMore = false;
      break;
    }

    events.push(...page);
    hasMore = page.length === pageSize;
    from += pageSize;
  }

  if (error) {
    return NextResponse.json({ error: "Unable to export crawler events" }, { status: 500 });
  }

  const header = ["timestamp", "page_url", "bot_name", "platform", "bot_type", "user_agent"];
  const rows = events.map((event) =>
    [
      event.occurred_at,
      event.page_url,
      event.bot_name,
      event.platform,
      event.bot_type,
      event.user_agent,
    ].map(toCsvCell).join(","),
  );

  const csv = [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="crawler-activity-${range}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

function getDateRangeStartIso(range: "24h" | "7d" | "30d") {
  const now = Date.now();
  const durationMs = range === "24h" ? 24 * 60 * 60 * 1000 : range === "7d" ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return new Date(now - durationMs).toISOString();
}

function toCsvCell(value: string | null) {
  const safe = value ?? "";
  return `"${safe.replace(/"/g, "\"\"")}"`;
}
