import Link from "next/link";
import type { Route } from "next";

import { AuthSubmitButton } from "@/components/auth-submit-button";

type AuthCardProps = {
  title: string;
  description: string;
  submitLabel: string;
  pendingLabel: string;
  alternateLabel: string;
  alternateHref: Route;
  alternateText: string;
  action: (formData: FormData) => Promise<void>;
};

export function AuthCard({
  title,
  description,
  submitLabel,
  pendingLabel,
  alternateLabel,
  alternateHref,
  alternateText,
  action,
}: AuthCardProps) {
  return (
    <section className="panel relative overflow-hidden rounded-[2rem] p-6 md:p-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#3ecf8e]/12 to-transparent" />

      <div className="relative">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              Secure access
            </p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
            <p className="max-w-xl text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Email + password
          </span>
        </div>

        <form action={action} className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              required
              type="email"
              name="email"
              autoComplete="email"
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <input
              required
              minLength={8}
              type="password"
              name="password"
              autoComplete={submitLabel === "Create account" ? "new-password" : "current-password"}
              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/25"
            />
          </label>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
            <AuthSubmitButton idleLabel={submitLabel} pendingLabel={pendingLabel} />
            <p className="text-sm text-[var(--muted-foreground)]">
              {alternateText}{" "}
              <Link href={alternateHref} className="font-semibold text-[var(--accent-strong)]">
                {alternateLabel}
              </Link>
            </p>
          </div>
        </form>
      </div>
    </section>
  );
}
