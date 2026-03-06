"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSupabaseClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/$/, "");
}

function getConfiguredOrigin() {
  const explicit =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL;

  if (explicit) {
    return normalizeOrigin(explicit);
  }

  const vercelUrl = process.env.VERCEL_URL;
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercelProductionUrl) {
    return `https://${vercelProductionUrl}`;
  }

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return null;
}

async function getRequestOrigin() {
  const configuredOrigin = getConfiguredOrigin();

  if (configuredOrigin) {
    return configuredOrigin;
  }

  // In production, require explicit origin config so auth emails never point
  // to localhost due to proxy/internal host headers.
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return normalizeOrigin(origin);
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`.replace(/\/$/, "");
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

export async function signUpAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/signup?error=Email%20and%20password%20are%20required");
  }

  const supabase = await getServerSupabaseClient();
  const origin = await getRequestOrigin();
  if (!origin) {
    redirect(
      "/signup?error=Missing%20site%20origin%20configuration.%20Set%20NEXT_PUBLIC_SITE_URL%20for%20this%20deployment.",
    );
  }
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
