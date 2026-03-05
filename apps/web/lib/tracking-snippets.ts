function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function getTrackingUrls(supabaseUrl: string) {
  const baseUrl = stripTrailingSlash(supabaseUrl);

  return {
    scriptUrl: `${baseUrl}/functions/v1/track/track.js`,
    pixelUrl: `${baseUrl}/functions/v1/track/track.gif`,
  };
}

export function getScriptInstallSnippet(
  supabaseUrl: string,
  trackingToken: string,
  options?: { spa?: boolean },
) {
  const { scriptUrl } = getTrackingUrls(supabaseUrl);
  const params = new URLSearchParams({ token: trackingToken });
  if (options?.spa) {
    params.set("spa", "1");
  }
  const url = `${scriptUrl}?${params.toString()}`;

  return `<script async src="${escapeAttribute(url)}"></script>`;
}

export function getPixelInstallSnippet(supabaseUrl: string, trackingToken: string) {
  const { pixelUrl } = getTrackingUrls(supabaseUrl);
  const url = `${pixelUrl}?token=${encodeURIComponent(trackingToken)}`;

  return `<img src="${escapeAttribute(url)}" alt="" width="1" height="1" style="display:none" />`;
}
