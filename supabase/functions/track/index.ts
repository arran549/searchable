import { getCorsHeaders } from "../_shared/cors.ts";
import { gif, json, text } from "../_shared/http.ts";
import { getScriptSource } from "../_shared/tracker-assets.ts";
import { insertEvent, type TrackPayload } from "../_shared/tracking.ts";

function getRoute(url: URL) {
  const parts = url.pathname.split("/").filter(Boolean);

  return parts.at(-1) ?? "track";
}

function getPublicTrackEndpoint(request: Request, url: URL) {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const originHost = url.host;

  if (forwardedHost || originHost) {
    const protocol = (forwardedProto?.split(",")[0]?.trim() || url.protocol.replace(":", "") || "http").toLowerCase();
    let host = forwardedHost || originHost;

    // Some proxies forward host without port (e.g. 127.0.0.1). Re-attach non-default port from request URL.
    if (host && !host.includes(":") && url.port && url.port !== "80" && url.port !== "443") {
      host = `${host}:${url.port}`;
    }

    return `${protocol}://${host}/functions/v1/track`;
  }

  const origin = url.origin.replace(/\/$/, "");
  return `${origin}/functions/v1/track`;
}

function parseOptionalBoolean(value: string | null) {
  if (value == null || value === "") {
    return undefined;
  }

  const normalized = value.toLowerCase();
  if (normalized === "1" || normalized === "true") {
    return true;
  }
  if (normalized === "0" || normalized === "false") {
    return false;
  }

  return undefined;
}

async function handlePixel(request: Request, url: URL) {
  const token = url.searchParams.get("token");
  const pageUrl = url.searchParams.get("pageUrl") ?? request.headers.get("referer");
  const pagePath = url.searchParams.get("pagePath") ?? undefined;
  const logNonAiTraffic = parseOptionalBoolean(
    url.searchParams.get("non_ai") ?? url.searchParams.get("nonAi"),
  );

  if (token && pageUrl) {
    await insertEvent({
      token,
      pageUrl,
      pagePath,
      source: "pixel",
      logNonAiTraffic,
      request,
    });
  }

  return gif(request);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: getCorsHeaders(request) });
  }

  const url = new URL(request.url);
  const route = getRoute(url);

  if (request.method === "GET" && route === "status") {
    return json(
      {
        ok: true,
        service: "track",
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: Boolean(Deno.env.get("SUPABASE_URL")),
          hasServiceRoleKey: Boolean(Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")),
        },
      },
      200,
      request,
    );
  }

  if (request.method === "GET" && route === "track.js") {
    return text(
      getScriptSource(getPublicTrackEndpoint(request, url)),
      "application/javascript; charset=utf-8",
      request,
    );
  }

  if (request.method === "GET" && route === "track.gif") {
    return await handlePixel(request, url);
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, request);
  }

  const payload = (await request.json().catch(() => null)) as TrackPayload | null;

  if (!payload) {
    return json({ error: "Invalid JSON body" }, 400, request);
  }

  try {
    return await insertEvent({
      ...payload,
      request,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return json({ error: message }, 500, request);
  }
});
