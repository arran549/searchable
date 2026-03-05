function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function getScriptSource(endpoint: string) {
  return `(() => {
  const fallbackEndpoint = "${endpoint}";
  const scripts = Array.from(document.getElementsByTagName("script"));
  const script =
    (document.currentScript && "src" in document.currentScript
      ? document.currentScript
      : scripts
          .slice()
          .reverse()
          .find((node) => {
            const src = node.getAttribute("src") || "";
            return /\\/track\\.js(?:\\?|$)/.test(src) || node.hasAttribute("data-site-token");
          })) || null;
  if (!script) return;

  let scriptUrl;
  try {
    scriptUrl = new URL(script.src, location.href);
  } catch {
    return;
  }

  const endpoint =
    script.getAttribute("data-track-endpoint") ||
    scriptUrl.searchParams.get("endpoint") ||
    new URL("/functions/v1/track", scriptUrl.origin).toString() ||
    fallbackEndpoint;
  const token = script.getAttribute("data-site-token") || scriptUrl.searchParams.get("token");
  if (!token) return;

  const spaValue = (
    script.getAttribute("data-track-spa") ||
    scriptUrl.searchParams.get("spa") ||
    scriptUrl.searchParams.get("trackSpa") ||
    ""
  ).toLowerCase();
  const trackSpa = spaValue === "1" || spaValue === "true";
  const debugValue = (script.getAttribute("data-track-debug") || scriptUrl.searchParams.get("debug") || "").toLowerCase();
  const debug = debugValue === "1" || debugValue === "true";
  let lastUrl = "";

  const log = (...args) => {
    if (debug) console.info("[searchable-track]", ...args);
  };

  const track = () => {
    const currentUrl = location.href;
    if (currentUrl === lastUrl) return;
    lastUrl = currentUrl;

    const payload = {
      token,
      pageUrl: currentUrl,
      pagePath: location.pathname,
      occurredAt: new Date().toISOString(),
      referrer: document.referrer || undefined,
      title: document.title || undefined,
      source: "script",
    };

    fetch(endpoint, {
      method: "POST",
      mode: "cors",
      credentials: "omit",
      keepalive: true,
      body: JSON.stringify(payload),
    })
      .then((response) => {
        if (!response.ok) log("response", response.status);
      })
      .catch((error) => {
        log("error", String(error));
      });
  };

  let timer;
  const scheduleTrack = () => {
    clearTimeout(timer);
    timer = setTimeout(track, 80);
  };

  track();
  if (!trackSpa) return;

  const pushState = history.pushState;
  const replaceState = history.replaceState;
  history.pushState = function (...args) {
    pushState.apply(this, args);
    scheduleTrack();
  };
  history.replaceState = function (...args) {
    replaceState.apply(this, args);
    scheduleTrack();
  };
  addEventListener("popstate", scheduleTrack);
  addEventListener("hashchange", scheduleTrack);
})();`;
}

export function getScriptInstallSnippet(
  scriptUrl: string,
  trackingToken: string,
  options?: { spa?: boolean },
) {
  const params = new URLSearchParams({ token: trackingToken });
  if (options?.spa) {
    params.set("spa", "1");
  }

  return `<script async src="${escapeAttribute(`${scriptUrl}?${params.toString()}`)}"></script>`;
}

export function getPixelInstallSnippet(pixelUrl: string, trackingToken: string) {
  const url = `${pixelUrl}?token=${encodeURIComponent(trackingToken)}`;

  return `<img src="${escapeAttribute(url)}" alt="" width="1" height="1" style="display:none" />`;
}
