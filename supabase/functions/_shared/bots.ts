export type BotType = "training" | "search" | "assistant" | "unknown" | "non_ai";
export type DetectionTarget = "request_user_agent" | "robots_policy";

export type BotDefinition = {
  id: string;
  name: string;
  platform: string;
  type: BotType;
  detectionTarget: DetectionTarget;
  matchers: RegExp[];
};

export type BotClassification = {
  id: string | null;
  name: string;
  platform: string;
  type: BotType;
  isKnown: boolean;
  detectionTarget: DetectionTarget | null;
  matchedPattern: string | null;
};

export type TrackableBotClassification = BotClassification & {
  shouldTrack: true;
};

function wordPattern(value: string) {
  return new RegExp(`\\b${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
}

export const BOT_DEFINITIONS: BotDefinition[] = [
  {
    id: "openai-gptbot",
    name: "GPTBot",
    platform: "OpenAI",
    type: "training",
    detectionTarget: "request_user_agent",
    matchers: [wordPattern("GPTBot")],
  },
  {
    id: "openai-chatgpt-user",
    name: "ChatGPT-User",
    platform: "OpenAI",
    type: "assistant",
    detectionTarget: "request_user_agent",
    matchers: [wordPattern("ChatGPT-User")],
  },
  {
    id: "openai-oai-searchbot",
    name: "OAI-SearchBot",
    platform: "OpenAI",
    type: "search",
    detectionTarget: "request_user_agent",
    matchers: [wordPattern("OAI-SearchBot")],
  },
  {
    id: "anthropic-claudebot",
    name: "ClaudeBot",
    platform: "Anthropic",
    type: "training",
    detectionTarget: "request_user_agent",
    matchers: [wordPattern("ClaudeBot")],
  },
  {
    id: "perplexity-perplexitybot",
    name: "PerplexityBot",
    platform: "Perplexity",
    type: "search",
    detectionTarget: "request_user_agent",
    matchers: [wordPattern("PerplexityBot")],
  },
  {
    id: "meta-external-agent",
    name: "Meta-ExternalAgent",
    platform: "Meta",
    type: "training",
    detectionTarget: "request_user_agent",
    matchers: [wordPattern("Meta-ExternalAgent")],
  },
  {
    id: "commoncrawl-ccbot",
    name: "CCBot",
    platform: "Common Crawl",
    type: "training",
    detectionTarget: "request_user_agent",
    matchers: [wordPattern("CCBot")],
  },
  {
    id: "bytedance-bytespider",
    name: "Bytespider",
    platform: "ByteDance",
    type: "training",
    detectionTarget: "request_user_agent",
    matchers: [wordPattern("Bytespider")],
  },

  // These are robots.txt policy tokens, not request user-agents. Keep them in the registry
  // for future policy/verification work, but do not classify them from HTTP request UAs.
  {
    id: "google-google-extended",
    name: "Google-Extended",
    platform: "Google",
    type: "training",
    detectionTarget: "robots_policy",
    matchers: [wordPattern("Google-Extended")],
  },
  {
    id: "apple-applebot-extended",
    name: "Applebot-Extended",
    platform: "Apple",
    type: "training",
    detectionTarget: "robots_policy",
    matchers: [wordPattern("Applebot-Extended")],
  },
];

const REQUEST_USER_AGENT_BOTS = BOT_DEFINITIONS.filter(
  (definition) => definition.detectionTarget === "request_user_agent",
);

const GENERIC_BOT_LIKE_MATCHERS = [
  /\bbot\b/i,
  /\bcrawl(?:er)?\b/i,
  /\bspider\b/i,
  /\bslurp\b/i,
  /\barchiver\b/i,
  /\bfetcher\b/i,
  /\bpreview\b/i,
];

export const UNKNOWN_BOT_CLASSIFICATION: BotClassification = {
  id: null,
  name: "Unknown",
  platform: "Unknown",
  type: "unknown",
  isKnown: false,
  detectionTarget: null,
  matchedPattern: null,
};

export const NON_AI_CLASSIFICATION: BotClassification = {
  id: "non-ai-traffic",
  name: "Non-AI",
  platform: "Non-AI",
  type: "non_ai",
  isKnown: false,
  detectionTarget: "request_user_agent",
  matchedPattern: null,
};

export function classifyBot(userAgent: string): BotClassification {
  const normalizedUserAgent = userAgent.trim();

  if (!normalizedUserAgent) {
    return UNKNOWN_BOT_CLASSIFICATION;
  }

  for (const definition of REQUEST_USER_AGENT_BOTS) {
    for (const matcher of definition.matchers) {
      if (matcher.test(normalizedUserAgent)) {
        return {
          id: definition.id,
          name: definition.name,
          platform: definition.platform,
          type: definition.type,
          isKnown: true,
          detectionTarget: definition.detectionTarget,
          matchedPattern: matcher.source,
        };
      }
    }
  }

  return UNKNOWN_BOT_CLASSIFICATION;
}

export function classifyTrackableBot(userAgent: string): TrackableBotClassification | null {
  const classification = classifyBot(userAgent);

  if (classification.isKnown) {
    return {
      ...classification,
      shouldTrack: true,
    };
  }

  const normalizedUserAgent = userAgent.trim();

  if (!normalizedUserAgent) {
    return null;
  }

  for (const matcher of GENERIC_BOT_LIKE_MATCHERS) {
    if (matcher.test(normalizedUserAgent)) {
      return {
        ...UNKNOWN_BOT_CLASSIFICATION,
        detectionTarget: "request_user_agent",
        matchedPattern: matcher.source,
        shouldTrack: true,
      };
    }
  }

  return {
    ...NON_AI_CLASSIFICATION,
    shouldTrack: true,
  };
}

export function getSupportedRequestBots() {
  return REQUEST_USER_AGENT_BOTS;
}

export function getPolicyOnlyBots() {
  return BOT_DEFINITIONS.filter((definition) => definition.detectionTarget === "robots_policy");
}
