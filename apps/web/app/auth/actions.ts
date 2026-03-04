"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerSupabaseClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const origin = headerStore.get("origin");

  if (origin) {
    return origin;
  }

  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto = headerStore.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${proto}://${host}`;
  }

  return "http://127.0.0.1:3000";
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
