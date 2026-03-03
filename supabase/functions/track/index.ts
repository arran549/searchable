import { createClient } from "npm:@supabase/supabase-js@2.98.0";

import { classifyBot } from "../_shared/bots.ts";
import { corsHeaders } from "../_shared/cors.ts";

type TrackPayload = {
  siteId?: string;
  pageUrl?: string;
  pagePath?: string;
  occurredAt?: string;
  userAgent?: string;
  ipHash?: string;
  source?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const payload = (await request.json().catch(() => null)) as TrackPayload | null;

  if (!payload?.siteId || !payload.pageUrl) {
    return json({ error: "siteId and pageUrl are required" }, 400);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Missing Supabase environment configuration" }, 500);
  }

  const userAgent = payload.userAgent ?? request.headers.get("user-agent") ?? "Unknown";
  const bot = classifyBot(userAgent);
  const occurredAt = payload.occurredAt ?? new Date().toISOString();

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { error } = await supabase.from("crawler_events").insert({
    site_id: payload.siteId,
    occurred_at: occurredAt,
    user_agent: userAgent,
    bot_name: bot.name,
    platform: bot.platform,
    bot_type: bot.type,
    page_url: payload.pageUrl,
    page_path: getPagePath(payload.pageUrl, payload.pagePath),
    ip_hash: payload.ipHash ?? null,
    source: payload.source ?? "script",
    raw_payload: payload,
  });

  if (error) {
    return json({ error: error.message }, 500);
  }

  return json({ ok: true }, 202);
});
