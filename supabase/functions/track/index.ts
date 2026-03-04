import { corsHeaders } from "../_shared/cors.ts";
import { gif, json, text } from "../_shared/http.ts";
import { getScriptSource } from "../_shared/tracker-assets.ts";
import { insertEvent, type TrackPayload } from "../_shared/tracking.ts";

function getRoute(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);

  return parts.at(-1) ?? "track";
}

function getStatus() {
  return json({
    ok: true,
    service: "track",
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: Boolean(Deno.env.get("SUPABASE_URL")),
      hasServiceRoleKey: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
    },
  });
}

async function handlePixel(request: Request, url: URL) {
  const token = url.searchParams.get("token");
  const pageUrl = url.searchParams.get("pageUrl") ?? request.headers.get("referer");
  const pagePath = url.searchParams.get("pagePath") ?? undefined;

  if (token && pageUrl) {
    await insertEvent({
      token,
      pageUrl,
      pagePath,
      source: "pixel",
      request,
    });
  }

  return gif();
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(request.url);
  const route = getRoute(url);

  if (request.method === "GET" && route === "status") {
    return getStatus();
  }

  if (request.method === "GET" && route === "track.js") {
    const baseUrl = new URL(request.url);
    baseUrl.pathname = baseUrl.pathname.replace(/\/track\.js$/, "");
    return text(getScriptSource(baseUrl.toString()), "application/javascript; charset=utf-8");
  }

  if (request.method === "GET" && route === "track.gif") {
    return await handlePixel(request, url);
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const payload = (await request.json().catch(() => null)) as TrackPayload | null;

  if (!payload) {
    return json({ error: "Invalid JSON body" }, 400);
  }

  try {
    return await insertEvent({
      ...payload,
      request,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500);
  }
});
