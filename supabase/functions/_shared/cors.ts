const allowHeaders = "authorization, content-type, x-client-info, apikey";
const allowMethods = "OPTIONS, GET, POST";

export function getCorsHeaders(request?: Request) {
  const origin = request?.headers.get("origin");

  if (origin) {
    return {
      "Access-Control-Allow-Headers": allowHeaders,
      "Access-Control-Allow-Methods": allowMethods,
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      Vary: "Origin",
    };
  }

  return {
    "Access-Control-Allow-Headers": allowHeaders,
    "Access-Control-Allow-Methods": allowMethods,
    "Access-Control-Allow-Origin": "*",
  };
}

export const corsHeaders = getCorsHeaders();
