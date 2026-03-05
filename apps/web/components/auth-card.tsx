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
    <section className="panel rounded-[2rem] p-6 md:p-8">
      <div className="mb-6 space-y-2">
        <h1 className="text-3xl font-semibold tracking-[-0.04em]">{title}</h1>
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
      </div>

      <form action={action} className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input
            required
            type="email"
            name="email"
            autoComplete="email"
            className="w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
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
            className="w-full rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)]"
          />
        </label>

        <div className="flex items-center justify-between gap-4 pt-2">
          <AuthSubmitButton idleLabel={submitLabel} pendingLabel={pendingLabel} />
          <p className="text-sm text-[var(--muted-foreground)]">
            {alternateText}{" "}
            <Link href={alternateHref} className="font-semibold text-[var(--accent-strong)]">
              {alternateLabel}
            </Link>
          </p>
        </div>
      </form>
    </section>
  );
}
