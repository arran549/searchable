export function getScriptSource(baseUrl: string) {
  return `(() => {
  const currentScript = document.currentScript;
  if (!currentScript) return;

  const token = currentScript.getAttribute("data-site-token");
  if (!token) return;

  const payload = {
    token,
    pageUrl: window.location.href,
    pagePath: window.location.pathname,
    occurredAt: new Date().toISOString(),
    referrer: document.referrer || undefined,
    title: document.title || undefined,
    source: "script"
  };

  const body = JSON.stringify(payload);
  const endpoint = "${baseUrl}";

  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
    return;
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    mode: "cors"
  }).catch(() => {});
})();`;
}
