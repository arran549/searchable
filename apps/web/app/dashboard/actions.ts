"use server";

import { redirect } from "next/navigation";
import type { Route } from "next";

import { getServerSupabaseClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDomain(value: string) {
  const withoutProtocol = value
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  return withoutProtocol;
}

function normalizeReturnTo(value: string) {
  if (!value || !value.startsWith("/dashboard")) {
    return "/dashboard/sites";
  }

  return value;
}

function redirectWithStatus(returnTo: string, type: "message" | "error", text: string) {
  const query = new URLSearchParams({ [type]: text }).toString();
  redirect(`${returnTo}?${query}` as Route);
}

function extractMetaVerificationToken(html: string) {
  const metaTagMatches = html.match(/<meta\s+[^>]*>/gi) ?? [];
  for (const tag of metaTagMatches) {
    const nameMatch = tag.match(/\bname\s*=\s*["']([^"']+)["']/i);
    if (!nameMatch || nameMatch[1].toLowerCase() !== "searchable-site-verification") {
      continue;
    }

    const contentMatch = tag.match(/\bcontent\s*=\s*["']([^"']+)["']/i);
    if (contentMatch?.[1]) {
      return contentMatch[1].trim();
    }
  }

  return null;
}

async function fetchTextWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "searchable-domain-verifier/1.0",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchJsonWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "user-agent": "searchable-domain-verifier/1.0",
        accept: "application/dns-json, application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function normalizeDnsTxtValue(value: string) {
  const quotedSegments = Array.from(value.matchAll(/"([^"]*)"/g)).map((match) => match[1]);
  if (quotedSegments.length) {
    return quotedSegments.join("").trim();
  }

  return value.trim().replace(/^"|"$/g, "");
}

async function verifyDnsTxtRecord(domain: string, expectedToken: string, timeoutMs: number) {
  type DnsAnswer = {
    data?: string;
  };
  type DnsResolveResponse = {
    Answer?: DnsAnswer[];
  };

  const hostname = `_searchable-verify.${domain}`;
  const result = (await fetchJsonWithTimeout(
    `https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=TXT`,
    timeoutMs,
  )) as DnsResolveResponse | null;

  if (!result || typeof result !== "object") {
    return false;
  }

  const answers = Array.isArray(result.Answer) ? result.Answer : [];
  const txtValues = answers
    .map((answer: DnsAnswer) => {
      const data = answer.data;
      return typeof data === "string" ? normalizeDnsTxtValue(data) : null;
    })
    .filter((value: string | null): value is string => Boolean(value));

  return txtValues.includes(expectedToken);
}

export async function createSiteAction(formData: FormData) {
  const rawDomain = getString(formData, "domain");
  const name = getString(formData, "name") || null;
  const domain = normalizeDomain(rawDomain);

  if (!domain) {
    redirect("/dashboard/settings?error=Domain%20is%20required");
  }

  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20log%20in%20to%20create%20a%20site");
  }

  const { error } = await supabase.from("sites").insert({
    user_id: user.id,
    domain,
    name,
  });

  if (error) {
    redirect(`/dashboard/settings?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard/settings?message=Site%20created");
}

export async function verifySiteAction(formData: FormData) {
  const siteId = getString(formData, "siteId");
  const returnTo = normalizeReturnTo(getString(formData, "returnTo"));

  if (!siteId) {
    return redirectWithStatus(returnTo, "error", "Missing site id");
  }

  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20log%20in%20to%20verify%20a%20site");
  }

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, domain, verification_token, verified_at")
    .eq("id", siteId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (siteError || !site) {
    return redirectWithStatus(returnTo, "error", "Site not found");
  }

  if (site.verified_at) {
    return redirectWithStatus(returnTo, "message", "Domain is already verified");
  }

  const expectedToken = site.verification_token;
  const domain = site.domain;
  const timeoutMs = 6000;
  const dnsVerified = await verifyDnsTxtRecord(domain, expectedToken, timeoutMs);

  const wellKnownText = await fetchTextWithTimeout(
    `https://${domain}/.well-known/searchable-verification.txt`,
    timeoutMs,
  );

  const txtVerified = wellKnownText?.trim() === expectedToken;
  let metaVerified = false;

  if (!dnsVerified && !txtVerified) {
    const homepage = await fetchTextWithTimeout(`https://${domain}/`, timeoutMs);
    if (homepage) {
      metaVerified = extractMetaVerificationToken(homepage) === expectedToken;
    }
  }

  if (!dnsVerified && !txtVerified && !metaVerified) {
    return redirectWithStatus(
      returnTo,
      "error",
      "Verification failed. Add DNS TXT _searchable-verify, or publish the token file/meta tag and try again.",
    );
  }

  const { error: updateError } = await supabase
    .from("sites")
    .update({ verified_at: new Date().toISOString() })
    .eq("id", site.id)
    .eq("user_id", user.id);

  if (updateError) {
    return redirectWithStatus(returnTo, "error", updateError.message);
  }

  return redirectWithStatus(returnTo, "message", "Domain verified");
}

export async function updateSiteTrafficLoggingAction(formData: FormData) {
  const siteId = getString(formData, "siteId");
  const returnTo = normalizeReturnTo(getString(formData, "returnTo"));
  const logNonAiTraffic = formData.get("logNonAiTraffic") === "1";

  if (!siteId) {
    return redirectWithStatus(returnTo, "error", "Missing site id");
  }

  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?message=Please%20log%20in%20to%20update%20site%20settings");
  }

  const { error } = await supabase
    .from("sites")
    .update({ log_non_ai_traffic: logNonAiTraffic })
    .eq("id", siteId)
    .eq("user_id", user.id);

  if (error) {
    return redirectWithStatus(returnTo, "error", error.message);
  }

  return redirectWithStatus(returnTo, "message", `Non-AI traffic logging ${logNonAiTraffic ? "enabled" : "disabled"}`);
}
