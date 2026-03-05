import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { signInAction } from "@/app/auth/actions";
import { getServerSupabaseClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

const highlights = ["Domain onboarding", "Crawler attribution", "Timeline analytics"];

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, message } = await searchParams;
  const supabase = await getServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="shell px-4 py-8 md:px-6 md:py-12">
      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="panel relative overflow-hidden rounded-[2rem] border-[#203042] bg-[#112033] p-6 text-[#fae8c8] md:p-8">
          <div className="pointer-events-none absolute -top-16 -left-16 h-44 w-44 rounded-full bg-[#3ecf8e]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -right-10 h-52 w-52 rounded-full bg-[#f59e0b]/20 blur-3xl" />

          <div className="relative">
            <p className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#f4dec0]">
              Searchable auth
            </p>
            <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.05em]">
              Log in to view your crawler analytics.
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-7 text-[#f4dec0]">
              Pick up where you left off with protected access to domain setup, event ingestion, and
              platform-level reporting.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {highlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#f4dec0]"
                >
                  {item}
                </span>
              ))}
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-white/15 bg-white/8 p-5">
              <p className="text-sm leading-7 text-[#f4dec0]">
                New here? Create an account, register your domain, install tracking, and verify the
                first crawler event in minutes.
              </p>
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          {message ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-[#cf6f2e] bg-[#fff4ea] px-4 py-3 text-sm text-[#9d4511]">
              {error}
            </div>
          ) : null}

          <AuthCard
            title="Log in"
            description="Use the email and password for your Searchable take-home account."
            submitLabel="Log in"
            pendingLabel="Signing in..."
            alternateText="Need an account?"
            alternateLabel="Create one"
            alternateHref="/signup"
            action={signInAction}
          />

          <p className="text-sm text-[var(--muted-foreground)]">
            <Link href="/" className="font-semibold text-[var(--accent-strong)]">
              Back to home
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

