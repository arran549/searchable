import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthCard } from "@/components/auth-card";
import { signUpAction } from "@/app/auth/actions";
import { getServerSupabaseClient } from "@/lib/supabase/server";

type SignupPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
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
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
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
            title="Create account"
            description="Set up a Searchable account so you can add sites and view protected analytics."
            submitLabel="Create account"
            pendingLabel="Creating..."
            alternateText="Already have an account?"
            alternateLabel="Log in"
            alternateHref="/login"
            action={signUpAction}
          />

          <p className="text-sm text-[var(--muted-foreground)]">
            <Link href="/" className="font-semibold text-[var(--accent-strong)]">
              Back to home
            </Link>
          </p>
        </div>

        <div className="panel rounded-[2rem] bg-[#132230] p-6 text-[#f6f0e7] md:p-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6bfaa]">
            Fast install
          </p>
          <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.05em]">
            One account, one dashboard, one install flow.
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-[#d6bfaa]">
            The goal here is not enterprise auth complexity. It is a clean email/password flow
            that gets you into the product quickly for the take-home.
          </p>

          <div className="mt-8 grid gap-3">
            {[
              "Create account",
              "Add website domain",
              "Copy tracking snippet",
              "See crawler events",
            ].map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
