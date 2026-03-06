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

const returnFlow = [
  {
    title: "Authenticate",
    detail: "Sign in with the email and password tied to your protected Searchable workspace.",
  },
  {
    title: "Resume setup",
    detail: "Continue domain verification, snippet installation, or crawler token validation.",
  },
  {
    title: "Review analytics",
    detail: "Inspect recent crawler/platform activity and confirm event ingestion health.",
  },
];

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

        <aside className="relative overflow-hidden rounded-[2rem] border border-[#203042] bg-[#112033] p-6 text-[#fef9e6] shadow-[var(--shadow)] md:p-8">
          <div className="pointer-events-none absolute -top-16 -right-16 h-44 w-44 rounded-full bg-[#f59e0b]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full bg-[#3ecf8e]/20 blur-3xl" />

          <div className="relative">
            <p className="mb-4 inline-flex rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#fef2d6]">
              Welcome back
            </p>
            <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.05em] text-white">
              Log in and continue where you left off.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-[#fef2d6]">
              Your workspace is ready. Re-enter to finish onboarding tasks and monitor crawler analytics in real time.
            </p>

            <div className="mt-8 grid gap-4">
              {returnFlow.map((step, index) => (
                <article
                  key={step.title}
                  className="group rounded-2xl border border-white/20 bg-white/10 px-5 py-4 transition hover:border-white/40 hover:bg-white/15"
                >
                  <div className="flex items-start gap-4">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/30 bg-[#0f1b2b] text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-base font-semibold text-white">{step.title}</p>
                      <p className="mt-1.5 text-sm leading-6 text-[#fef2d6]">{step.detail}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

