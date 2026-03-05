import { getCorsHeaders } from "./cors.ts";

const transparentGif = Uint8Array.from([
  71, 73, 70, 56, 57, 97, 1, 0, 1, 0, 128, 0, 0, 0, 0, 0, 255, 255, 255, 33, 249, 4, 1, 0,
  0, 1, 0, 44, 0, 0, 0, 0, 1, 0, 1, 0, 0, 2, 2, 68, 1, 0, 59,
]);

export function json(body: unknown, status = 200, request?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(request),
      "Content-Type": "application/json",
    },
  });
}

export function text(body: string, contentType: string, request?: Request) {
  return new Response(body, {
    headers: {
      ...getCorsHeaders(request),
      "Cache-Control": "public, max-age=300",
      "Content-Type": contentType,
    },
  });
}

export function gif(request?: Request) {
  return new Response(transparentGif, {
    headers: {
      ...getCorsHeaders(request),
      "Cache-Control": "no-store",
      "Content-Type": "image/gif",
    },
  });
}
