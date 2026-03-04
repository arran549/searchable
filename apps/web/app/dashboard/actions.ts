"use server";

import { redirect } from "next/navigation";

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

export async function createSiteAction(formData: FormData) {
  const rawDomain = getString(formData, "domain");
  const name = getString(formData, "name") || null;
  const domain = normalizeDomain(rawDomain);

  if (!domain) {
    redirect("/dashboard?error=Domain%20is%20required");
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
    redirect(`/dashboard?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard?message=Site%20created");
}
