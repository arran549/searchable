"use server";

import { redirect } from "next/navigation";

import { getServerSupabaseClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOrigin(origin: string) {
  const trimmed = origin.trim().replace(/\/$/, "");

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed;
  }
}

function getConfiguredOrigin() {
  const explicitCandidates = [
    { key: "SITE_URL", value: process.env.SITE_URL },
    { key: "NEXT_PUBLIC_SITE_URL", value: process.env.NEXT_PUBLIC_SITE_URL },
    { key: "NEXT_PUBLIC_APP_URL", value: process.env.NEXT_PUBLIC_APP_URL },
  ];

  for (const candidate of explicitCandidates) {
    if (candidate.value) {
      return {
        origin: normalizeOrigin(candidate.value),
        source: candidate.key,
      };
    }
  }

  const vercelUrl = process.env.VERCEL_URL;
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercelProductionUrl) {
    return {
      origin: `https://${vercelProductionUrl}`,
      source: "VERCEL_PROJECT_PRODUCTION_URL",
    };
  }

  if (vercelUrl) {
    return {
      origin: `https://${vercelUrl}`,
      source: "VERCEL_URL",
    };
  }

  return null;
}

function isLocalOrigin(origin: string) {
  return (
    origin.startsWith("http://127.0.0.1:") ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("https://127.0.0.1:") ||
    origin.startsWith("https://localhost:")
  );
}

function isHttpsOrigin(origin: string) {
  return origin.startsWith("https://");
}

export async function signUpAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/signup?error=Email%20and%20password%20are%20required");
  }

  const supabase = await getServerSupabaseClient();
  const resolvedOrigin = getConfiguredOrigin();
  if (!resolvedOrigin) {
    redirect(
      "/signup?error=Missing%20site%20origin%20configuration.%20Set%20SITE_URL%20(or%20NEXT_PUBLIC_SITE_URL)%20for%20this%20deployment.",
    );
  }

  const { origin, source } = resolvedOrigin;

  if (process.env.NODE_ENV === "production" && isLocalOrigin(origin)) {
    console.error("Invalid localhost auth origin in production", {
      source,
      origin,
    });
    redirect(
      "/signup?error=Invalid%20production%20site%20origin.%20NEXT_PUBLIC_SITE_URL%20(or%20SITE_URL)%20is%20set%20to%20localhost.",
    );
  }
  if (process.env.NODE_ENV === "production" && !isHttpsOrigin(origin)) {
    console.error("Invalid non-https auth origin in production", {
      source,
      origin,
    });
    redirect("/signup?error=Invalid%20production%20site%20origin.%20Use%20an%20HTTPS%20URL.");
  }

  console.info("Using signup email redirect origin", { source, origin });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    redirect("/dashboard");
  }

  if (isLocalOrigin(origin)) {
    redirect("/login?message=Account%20created.%20You%20can%20log%20in%20now");
  }

  redirect("/login?message=Check%20your%20email%20to%20confirm%20your%20account");
}

export async function signInAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=Email%20and%20password%20are%20required");
  }

  const supabase = await getServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await getServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login?message=Signed%20out");
}
