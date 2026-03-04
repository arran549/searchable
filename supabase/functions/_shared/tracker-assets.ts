function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function getScriptSource(endpoint: string) {
  return `(()=>{const s=document.currentScript;if(!s)return;const u=new URL(s.src),t=s.getAttribute("data-site-token")||u.searchParams.get("token");if(!t)return;const p={token:t,pageUrl:location.href,pagePath:location.pathname,occurredAt:new Date().toISOString(),referrer:document.referrer||undefined,title:document.title||undefined,source:"script"},b=JSON.stringify(p);if(navigator.sendBeacon){navigator.sendBeacon("${endpoint}",new Blob([b],{type:"application/json"}));return}fetch("${endpoint}",{method:"POST",headers:{"Content-Type":"application/json"},body:b,keepalive:true,mode:"cors"}).catch(()=>{})})();`;
}

export function getScriptInstallSnippet(scriptUrl: string, trackingToken: string) {
  const url = `${scriptUrl}?token=${encodeURIComponent(trackingToken)}`;

  return `<script async src="${escapeAttribute(url)}"></script>`;
}

export function getPixelInstallSnippet(pixelUrl: string, trackingToken: string) {
  const url = `${pixelUrl}?token=${encodeURIComponent(trackingToken)}`;

  return `<img src="${escapeAttribute(url)}" alt="" width="1" height="1" style="display:none" />`;
}
