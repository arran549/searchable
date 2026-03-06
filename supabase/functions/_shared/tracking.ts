import { createClient } from "npm:@supabase/supabase-js@2.98.0";

import { classifyTrackableBot } from "./bots.ts";
import { json } from "./http.ts";

export type TrackPayload = {
  token?: string;
  pageUrl?: string;
  pagePath?: string;
  occurredAt?: string;
  userAgent?: string;
  ipHash?: string;
  referrer?: string;
  title?: string;
  source?: string;
  logNonAiTraffic?: boolean;
};

function getSupabaseAdminClient() {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase environment configuration");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function getPagePath(pageUrl: string, pagePath?: string) {
  if (pagePath) {
    return pagePath;
  }

  try {
    return new URL(pageUrl).pathname;
  } catch {
    return pageUrl;
  }
}

function getIpAddress(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return realIp ?? cfIp ?? null;
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function resolveSiteByToken(token: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sites")
    .select("id, domain, tracking_token, log_non_ai_traffic")
    .eq("tracking_token", token)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function insertEvent({
  token,
  pageUrl,
  pagePath,
  occurredAt,
  userAgent,
  ipHash,
  referrer,
  title,
  source,
  logNonAiTraffic,
  request,
}: TrackPayload & { request: Request }) {
  if (!token || !pageUrl) {
    return json({ error: "token and pageUrl are required" }, 400, request);
  }

  const site = await resolveSiteByToken(token);

  if (!site) {
    return json({ error: "Invalid tracking token" }, 404, request);
  }

  const resolvedUserAgent = userAgent ?? request.headers.get("user-agent") ?? "Unknown";
  const bot = classifyTrackableBot(resolvedUserAgent);
  const resolvedBot = bot ?? {
    id: "non-ai-traffic",
    name: "Non-AI",
    platform: "Non-AI",
    type: "non_ai" as const,
    isKnown: false,
    detectionTarget: "request_user_agent" as const,
    matchedPattern: null,
    shouldTrack: true as const,
  };

  const shouldLogNonAiTraffic = logNonAiTraffic ?? site.log_non_ai_traffic;
  if (resolvedBot.type === "non_ai" && !shouldLogNonAiTraffic) {
    return json({ ok: true, skipped: "non_ai_disabled" }, 202, request);
  }

  const resolvedOccurredAt = occurredAt ?? new Date().toISOString();
  const ipAddress = getIpAddress(request);
  const resolvedIpHash = ipHash ?? (ipAddress ? await sha256Hex(ipAddress) : null);
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("crawler_events").insert({
    site_id: site.id,
    occurred_at: resolvedOccurredAt,
    user_agent: resolvedUserAgent,
    bot_name: resolvedBot.name,
    platform: resolvedBot.platform,
    bot_type: resolvedBot.type,
    page_url: pageUrl,
    page_path: getPagePath(pageUrl, pagePath),
    ip_hash: resolvedIpHash,
    source: source ?? "script",
    raw_payload: {
      token,
      pageUrl,
      pagePath,
      occurredAt: resolvedOccurredAt,
      referrer: referrer ?? request.headers.get("referer"),
      title,
      source: source ?? "script",
      classifier: {
        id: resolvedBot.id,
        isKnown: resolvedBot.isKnown,
        detectionTarget: resolvedBot.detectionTarget,
        matchedPattern: resolvedBot.matchedPattern,
      },
    },
  });

  if (error) {
    return json({ error: error.message }, 500, request);
  }

  return json({ ok: true }, 202, request);
}
