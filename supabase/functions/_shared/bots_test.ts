import { assertEquals } from "jsr:@std/assert";

import {
  BOT_DEFINITIONS,
  UNKNOWN_BOT_CLASSIFICATION,
  classifyBot,
  getPolicyOnlyBots,
  getSupportedRequestBots,
} from "./bots.ts";

Deno.test("classifies GPTBot as a known OpenAI training bot", () => {
  const result = classifyBot("Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)");

  assertEquals(result, {
    id: "openai-gptbot",
    name: "GPTBot",
    platform: "OpenAI",
    type: "training",
    isKnown: true,
    detectionTarget: "request_user_agent",
    matchedPattern: "\\bGPTBot\\b",
  });
});

Deno.test("classifies ChatGPT-User as an assistant bot", () => {
  const result = classifyBot("ChatGPT-User/1.0");

  assertEquals(result.id, "openai-chatgpt-user");
  assertEquals(result.platform, "OpenAI");
  assertEquals(result.type, "assistant");
  assertEquals(result.isKnown, true);
});

Deno.test("classifies OAI-SearchBot as a search bot", () => {
  const result = classifyBot("Mozilla/5.0 OAI-SearchBot/1.0");

  assertEquals(result.id, "openai-oai-searchbot");
  assertEquals(result.type, "search");
});

Deno.test("classifies ClaudeBot as an Anthropic training bot", () => {
  const result = classifyBot("ClaudeBot/1.0");

  assertEquals(result.id, "anthropic-claudebot");
  assertEquals(result.platform, "Anthropic");
  assertEquals(result.type, "training");
});

Deno.test("classifies PerplexityBot as a search bot", () => {
  const result = classifyBot("PerplexityBot");

  assertEquals(result.id, "perplexity-perplexitybot");
  assertEquals(result.platform, "Perplexity");
  assertEquals(result.type, "search");
});

Deno.test("classifies Meta-ExternalAgent as a known Meta training bot", () => {
  const result = classifyBot("Meta-ExternalAgent/1.1");

  assertEquals(result.id, "meta-external-agent");
  assertEquals(result.platform, "Meta");
});

Deno.test("classifies CCBot as a Common Crawl training bot", () => {
  const result = classifyBot("CCBot/2.0");

  assertEquals(result.id, "commoncrawl-ccbot");
  assertEquals(result.platform, "Common Crawl");
});

Deno.test("classifies Bytespider as a ByteDance training bot", () => {
  const result = classifyBot("Mozilla/5.0 Bytespider");

  assertEquals(result.id, "bytedance-bytespider");
  assertEquals(result.platform, "ByteDance");
});

Deno.test("returns unknown for unsupported or random user agents", () => {
  const result = classifyBot("Mozilla/5.0 SomeRandomBot/9.9");

  assertEquals(result, UNKNOWN_BOT_CLASSIFICATION);
});

Deno.test("returns unknown for empty user agents", () => {
  const result = classifyBot("   ");

  assertEquals(result, UNKNOWN_BOT_CLASSIFICATION);
});

Deno.test("does not classify Google-Extended from HTTP request user agents", () => {
  const result = classifyBot("Mozilla/5.0 Google-Extended");

  assertEquals(result, UNKNOWN_BOT_CLASSIFICATION);
});

Deno.test("policy-only bots remain available in the registry for future use", () => {
  const policyBots = getPolicyOnlyBots();

  assertEquals(
    policyBots.map((bot) => bot.id),
    ["google-google-extended", "apple-applebot-extended"],
  );
});

Deno.test("supported request bot registry excludes policy-only entries", () => {
  const requestBots = getSupportedRequestBots();

  assertEquals(requestBots.some((bot) => bot.id === "google-google-extended"), false);
  assertEquals(
    requestBots.map((bot) => bot.id),
    [
      "openai-gptbot",
      "openai-chatgpt-user",
      "openai-oai-searchbot",
      "anthropic-claudebot",
      "perplexity-perplexitybot",
      "meta-external-agent",
      "commoncrawl-ccbot",
      "bytedance-bytespider",
    ],
  );
});

Deno.test("bot registry ids stay unique", () => {
  const ids = BOT_DEFINITIONS.map((definition) => definition.id);
  const uniqueIds = new Set(ids);

  assertEquals(uniqueIds.size, ids.length);
});
