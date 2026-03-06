#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";

function usage() {
  console.log("Usage: node scripts/simulate-track-events.mjs [scenarioPath] [--dry-run]");
}

async function loadDotEnvFile(filePath) {
  try {
    const content = await readFile(filePath, "utf8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) {
        continue;
      }

      const equalIndex = line.indexOf("=");
      if (equalIndex < 1) {
        continue;
      }

      const key = line.slice(0, equalIndex).trim();
      let value = line.slice(equalIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing env files.
  }
}

async function loadLocalEnvFiles() {
  await loadDotEnvFile(path.resolve(process.cwd(), ".env.local"));
  await loadDotEnvFile(path.resolve(process.cwd(), ".env"));
}

async function readBrunoLocalVars() {
  try {
    const filePath = path.resolve(process.cwd(), "bruno/environments/local.bru");
    const content = await readFile(filePath, "utf8");
    const vars = {};
    let inVarsBlock = false;

    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      if (!inVarsBlock && line === "vars {") {
        inVarsBlock = true;
        continue;
      }

      if (inVarsBlock && line === "}") {
        break;
      }

      if (!inVarsBlock || line.startsWith("#")) {
        continue;
      }

      const match = line.match(/^([A-Za-z0-9_]+)\s*:\s*(.+)$/);
      if (!match) {
        continue;
      }

      vars[match[1]] = match[2].trim();
    }

    return vars;
  } catch {
    return {};
  }
}

function resolveConfigValue(rawValue, envKeys) {
  if (typeof rawValue === "string") {
    const trimmed = rawValue.trim();
    const envRefMatch = trimmed.match(/^\$\{([A-Z0-9_]+)\}$/i);
    if (envRefMatch) {
      const envValue = process.env[envRefMatch[1]];
      if (envValue && envValue.trim()) {
        return envValue.trim();
      }
    } else if (trimmed) {
      return trimmed;
    }
  }

  for (const envKey of envKeys) {
    const envValue = process.env[envKey];
    if (envValue && envValue.trim()) {
      return envValue.trim();
    }
  }

  return "";
}

function normalizeScenario(input, brunoVars = {}) {
  const scenario = { ...input };
  scenario.baseUrl = String(scenario.baseUrl ?? "http://127.0.0.1:54321").replace(/\/$/, "");
  if (!scenario.baseUrl && brunoVars.baseUrl) {
    scenario.baseUrl = String(brunoVars.baseUrl).replace(/\/$/, "");
  }
  scenario.concurrency = Number.isFinite(Number(scenario.concurrency)) ? Math.max(1, Number(scenario.concurrency)) : 6;
  scenario.delayMs = Number.isFinite(Number(scenario.delayMs)) ? Math.max(0, Number(scenario.delayMs)) : 0;
  scenario.source = String(scenario.source ?? "script");
  scenario.pagePath = String(scenario.pagePath ?? "/");
  scenario.publishableKey = resolveConfigValue(scenario.publishableKey, [
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_PUBLISHABLE_KEY",
    "SB_PUBLISHABLE_KEY",
    "PUBLISHABLE_KEY",
  ]) || String(brunoVars.publishableKey ?? "").trim();
  scenario.trackToken = resolveConfigValue(scenario.trackToken, [
    "SITE_TRACKING_TOKEN",
    "TRACK_TOKEN",
    "SEARCHABLE_TRACK_TOKEN",
  ]) || String(brunoVars.trackToken ?? "").trim();

  if (!scenario.publishableKey || !scenario.trackToken || !scenario.pageUrl) {
    throw new Error(
      "Scenario must include publishableKey, trackToken, and pageUrl. You can set publishableKey/trackToken directly or via env vars.",
    );
  }

  if (!Array.isArray(scenario.events) || scenario.events.length === 0) {
    throw new Error("Scenario must include a non-empty events array.");
  }

  return scenario;
}

function expandJobs(scenario) {
  const jobs = [];
  for (const event of scenario.events) {
    const ua = String(event.userAgent ?? "").trim();
    const count = Number(event.count ?? 0);

    if (!ua) {
      throw new Error("Each event requires userAgent.");
    }
    if (!Number.isInteger(count) || count < 1) {
      throw new Error(`Invalid count for userAgent '${ua}'. Count must be integer >= 1.`);
    }

    for (let i = 0; i < count; i += 1) {
      jobs.push({ userAgent: ua });
    }
  }
  return jobs;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    usage();
    process.exit(0);
  }

  const dryRun = args.includes("--dry-run");
  const scenarioPathArg = args.find((arg) => !arg.startsWith("-")) ?? "bruno/track/scenarios/default.json";
  const scenarioPath = path.resolve(process.cwd(), scenarioPathArg);

  await loadLocalEnvFiles();
  const brunoVars = await readBrunoLocalVars();
  const raw = await readFile(scenarioPath, "utf8");
  const scenario = normalizeScenario(JSON.parse(raw), brunoVars);
  const jobs = expandJobs(scenario);

  const totalsByUa = new Map();
  for (const job of jobs) {
    totalsByUa.set(job.userAgent, (totalsByUa.get(job.userAgent) ?? 0) + 1);
  }

  console.log(`Scenario: ${scenarioPath}`);
  console.log(`Endpoint: ${scenario.baseUrl}/functions/v1/track`);
  console.log(`Total events: ${jobs.length}`);
  console.log(`Concurrency: ${scenario.concurrency}, Delay: ${scenario.delayMs}ms`);

  if (dryRun) {
    console.log("\nDry run by userAgent:");
    for (const [ua, count] of totalsByUa.entries()) {
      console.log(`- ${ua}: ${count}`);
    }
    return;
  }

  const headers = {
    Accept: "application/json",
    Authorization: `Bearer ${scenario.publishableKey}`,
    apikey: scenario.publishableKey,
    "Content-Type": "application/json",
  };

  const stats = new Map();
  for (const ua of totalsByUa.keys()) {
    stats.set(ua, { sent: 0, ok: 0, failed: 0 });
  }

  let cursor = 0;
  async function worker() {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= jobs.length) {
        return;
      }

      const job = jobs[index];
      const summary = stats.get(job.userAgent);
      summary.sent += 1;

      const body = {
        token: scenario.trackToken,
        pageUrl: scenario.pageUrl,
        pagePath: scenario.pagePath,
        userAgent: job.userAgent,
        source: scenario.source,
      };

      try {
        const response = await fetch(`${scenario.baseUrl}/functions/v1/track`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });

        if (response.status === 202) {
          summary.ok += 1;
        } else {
          summary.failed += 1;
          const text = await response.text();
          console.error(`[${job.userAgent}] failed ${response.status}: ${text}`);
        }
      } catch (error) {
        summary.failed += 1;
        console.error(`[${job.userAgent}] request error: ${error instanceof Error ? error.message : String(error)}`);
      }

      if (scenario.delayMs > 0) {
        await sleep(scenario.delayMs);
      }
    }
  }

  const workers = Array.from({ length: scenario.concurrency }, () => worker());
  await Promise.all(workers);

  let totalOk = 0;
  let totalFailed = 0;

  console.log("\nResults by userAgent:");
  for (const [ua, summary] of stats.entries()) {
    totalOk += summary.ok;
    totalFailed += summary.failed;
    console.log(`- ${ua}`);
    console.log(`  sent=${summary.sent} ok=${summary.ok} failed=${summary.failed}`);
  }

  console.log(`\nDone. ok=${totalOk} failed=${totalFailed} total=${jobs.length}`);
  if (totalFailed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
