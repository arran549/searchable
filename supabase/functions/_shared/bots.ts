export type BotClassification = {
  name: string;
  platform: string;
  type: "training" | "search" | "assistant" | "unknown";
};

const BOT_PATTERNS: Array<{
  pattern: RegExp;
  name: string;
  platform: string;
  type: BotClassification["type"];
}> = [
  { pattern: /GPTBot/i, name: "GPTBot", platform: "OpenAI", type: "training" },
  { pattern: /ChatGPT-User/i, name: "ChatGPT-User", platform: "OpenAI", type: "assistant" },
  { pattern: /OAI-SearchBot/i, name: "OAI-SearchBot", platform: "OpenAI", type: "search" },
  { pattern: /ClaudeBot/i, name: "ClaudeBot", platform: "Anthropic", type: "training" },
  { pattern: /Claude-Web/i, name: "Claude-Web", platform: "Anthropic", type: "assistant" },
  { pattern: /PerplexityBot/i, name: "PerplexityBot", platform: "Perplexity", type: "search" },
  { pattern: /Meta-ExternalAgent/i, name: "Meta-ExternalAgent", platform: "Meta", type: "training" },
  { pattern: /Applebot-Extended/i, name: "Applebot-Extended", platform: "Apple", type: "training" },
  { pattern: /CCBot/i, name: "CCBot", platform: "Common Crawl", type: "training" },
  { pattern: /Bytespider/i, name: "Bytespider", platform: "ByteDance", type: "training" },
];

export function classifyBot(userAgent: string): BotClassification {
  for (const bot of BOT_PATTERNS) {
    if (bot.pattern.test(userAgent)) {
      return {
        name: bot.name,
        platform: bot.platform,
        type: bot.type,
      };
    }
  }

  return {
    name: "Unknown",
    platform: "Unknown",
    type: "unknown",
  };
}
