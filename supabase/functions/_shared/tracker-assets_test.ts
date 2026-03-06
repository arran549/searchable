import {
  assert,
  assertEquals,
  assertMatch,
  assertStringIncludes,
} from "jsr:@std/assert";

import {
  getPixelInstallSnippet,
  getScriptInstallSnippet,
  getScriptSource,
} from "./tracker-assets.ts";

type ScriptNode = {
  src: string;
  getAttribute: (name: string) => string | null;
  hasAttribute: (name: string) => boolean;
};

type BrowserHarness = {
  calls: Array<{ input: string; init: RequestInit }>;
  listeners: Map<string, () => void>;
  location: { href: string; pathname: string };
  history: History;
};

function createScriptNode(src: string, attrs: Record<string, string>): ScriptNode {
  return {
    src,
    getAttribute: (name: string) => attrs[name] ?? null,
    hasAttribute: (name: string) => Object.hasOwn(attrs, name),
  };
}

function setGlobal(name: string, value: unknown): () => void {
  const hadValue = Object.prototype.hasOwnProperty.call(globalThis, name);
  const previous = (globalThis as Record<string, unknown>)[name];
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });

  return () => {
    if (hadValue) {
      Object.defineProperty(globalThis, name, {
        configurable: true,
        writable: true,
        value: previous,
      });
      return;
    }
    delete (globalThis as Record<string, unknown>)[name];
  };
}

async function withBrowserHarness(
  options: {
    scriptSrc: string;
    attrs?: Record<string, string>;
    useCurrentScript?: boolean;
    initialHref?: string;
    initialPathname?: string;
  },
  run: (ctx: BrowserHarness) => Promise<void> | void,
) {
  const attrs = options.attrs ?? {};
  const script = createScriptNode(options.scriptSrc, attrs);
  const listeners = new Map<string, () => void>();
  const calls: Array<{ input: string; init: RequestInit }> = [];
  const location = {
    href: options.initialHref ?? "https://site.test/start",
    pathname: options.initialPathname ?? "/start",
  };
  const history = {
    pushState(_state: unknown, _title: string, url?: string | URL | null) {
      if (!url) return;
      const next = new URL(String(url), location.href);
      location.href = next.toString();
      location.pathname = next.pathname;
    },
    replaceState(_state: unknown, _title: string, url?: string | URL | null) {
      if (!url) return;
      const next = new URL(String(url), location.href);
      location.href = next.toString();
      location.pathname = next.pathname;
    },
  } as History;

  const restore = [
    setGlobal("document", {
      currentScript: options.useCurrentScript === false ? null : script,
      getElementsByTagName: () => [script],
      referrer: "https://referrer.test/from",
      title: "Example title",
    }),
    setGlobal("location", location),
    setGlobal("history", history),
    setGlobal("addEventListener", (event: string, callback: () => void) => {
      listeners.set(event, callback);
    }),
    setGlobal("fetch", (input: string, init: RequestInit) => {
      calls.push({ input, init });
      return Promise.resolve({ ok: true, status: 200 });
    }),
  ];

  try {
    await run({ calls, listeners, location, history });
  } finally {
    for (const undo of restore.reverse()) undo();
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

Deno.test("getScriptInstallSnippet renders token, options, and escaped src attribute", () => {
  const snippet = getScriptInstallSnippet(
    "https://api.example.com/track.js",
    `abc"&x=1`,
    { spa: true, nonAi: false },
  );

  assertStringIncludes(snippet, "<script async src=\"");
  assertStringIncludes(snippet, "token=abc%22%26x%3D1");
  assertStringIncludes(snippet, "spa=1");
  assertStringIncludes(snippet, "non_ai=0");
  assertStringIncludes(snippet, "&amp;");
});

Deno.test("getPixelInstallSnippet URL-encodes token and keeps required attributes", () => {
  const snippet = getPixelInstallSnippet("https://api.example.com/pixel.gif", `tok"&n=1`, {
    nonAi: false,
  });

  assertStringIncludes(snippet, "token=tok%22%26n%3D1");
  assertStringIncludes(snippet, "non_ai=0");
  assertStringIncludes(snippet, "width=\"1\"");
  assertStringIncludes(snippet, "height=\"1\"");
  assertStringIncludes(snippet, "display:none");
  assertStringIncludes(snippet, "&amp;");
});

Deno.test("script source does not track when token is missing", async () => {
  await withBrowserHarness(
    {
      scriptSrc: "https://cdn.example.com/track.js",
      attrs: {},
    },
    async ({ calls }) => {
      const source = getScriptSource("https://fallback.example.com/functions/v1/track");
      (0, eval)(source);
      await sleep(10);
      assertEquals(calls.length, 0);
    },
  );
});

Deno.test("script source tracks initial pageview and SPA navigation once per unique URL", async () => {
  await withBrowserHarness(
    {
      scriptSrc: "https://cdn.example.com/track.js?token=query-token&spa=1",
      attrs: {},
    },
    async ({ calls, history }) => {
      const source = getScriptSource("https://fallback.example.com/functions/v1/track");
      (0, eval)(source);
      await sleep(10);

      assertEquals(calls.length, 1);
      assertEquals(calls[0].input, "https://cdn.example.com/functions/v1/track");
      const firstPayload = JSON.parse(String(calls[0].init.body));
      assertEquals(firstPayload.token, "query-token");
      assertEquals(firstPayload.pagePath, "/start");
      assertEquals(firstPayload.source, "script");
      assertEquals(firstPayload.logNonAiTraffic, undefined);
      assertMatch(firstPayload.occurredAt, /^\d{4}-\d{2}-\d{2}T/);

      history.pushState({}, "", "/start");
      await sleep(120);
      assertEquals(calls.length, 1);

      history.pushState({}, "", "/products");
      await sleep(120);
      assertEquals(calls.length, 2);
      const secondPayload = JSON.parse(String(calls[1].init.body));
      assertEquals(secondPayload.pagePath, "/products");
    },
  );
});

Deno.test("script source forwards non-ai logging override from script query", async () => {
  await withBrowserHarness(
    {
      scriptSrc: "https://cdn.example.com/track.js?token=query-token&non_ai=0",
      attrs: {},
    },
    async ({ calls }) => {
      const source = getScriptSource("https://fallback.example.com/functions/v1/track");
      (0, eval)(source);
      await sleep(10);

      assertEquals(calls.length, 1);
      const payload = JSON.parse(String(calls[0].init.body));
      assertEquals(payload.logNonAiTraffic, false);
    },
  );
});

Deno.test("script source prefers explicit data-track-endpoint over query/default endpoint", async () => {
  await withBrowserHarness(
    {
      scriptSrc: "https://cdn.example.com/track.js?token=query-token&endpoint=https://query.example.com/track",
      attrs: {
        "data-site-token": "attr-token",
        "data-track-endpoint": "https://attr.example.com/track",
      },
    },
    async ({ calls }) => {
      const source = getScriptSource("https://fallback.example.com/functions/v1/track");
      (0, eval)(source);
      await sleep(10);

      assertEquals(calls.length, 1);
      assertEquals(calls[0].input, "https://attr.example.com/track");
      const payload = JSON.parse(String(calls[0].init.body));
      assertEquals(payload.token, "attr-token");
    },
  );
});

Deno.test("script source falls back to script tag discovery when currentScript is unavailable", async () => {
  await withBrowserHarness(
    {
      scriptSrc: "https://cdn.example.com/track.js?token=query-token",
      attrs: {},
      useCurrentScript: false,
    },
    async ({ calls }) => {
      const source = getScriptSource("https://fallback.example.com/functions/v1/track");
      (0, eval)(source);
      await sleep(10);

      assert(calls.length >= 1);
      assertEquals(calls[0].input, "https://cdn.example.com/functions/v1/track");
    },
  );
});
