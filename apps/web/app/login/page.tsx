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
        <div className="panel rounded-[2rem] bg-[#132230] p-6 text-[#f6f0e7] md:p-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6bfaa]">
            Searchable auth
          </p>
          <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.05em]">
            Log in to view your crawler analytics.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#d6bfaa]">
            This auth flow is built around Supabase email/password auth with SSR-friendly
            session handling for protected routes.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-[#d6bfaa]">
              New here? Create an account, add a site, copy the tracking snippet, and start
              collecting crawler events.
            </p>
          </div>
        </div>

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
