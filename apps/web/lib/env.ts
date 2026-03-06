function getRequiredEnv(key: "NEXT_PUBLIC_SUPABASE_URL") {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function getSupabasePublicKey() {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (publishableKey) {
    return publishableKey;
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (anonKey) {
    return anonKey;
  }

  throw new Error(
    "Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or legacy NEXT_PUBLIC_SUPABASE_ANON_KEY)",
  );
}

export function assertProductionEnv() {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (!process.env.SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL) {
    throw new Error(
      "Missing required environment variable in production: SITE_URL (or NEXT_PUBLIC_SITE_URL)",
    );
  }
}

export const env = {
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  },
  get NEXT_PUBLIC_SUPABASE_PUBLIC_KEY() {
    return getSupabasePublicKey();
  },
};
