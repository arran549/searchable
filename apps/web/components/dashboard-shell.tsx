import Link from "next/link";

import { signOutAction } from "@/app/auth/actions";
import { DashboardPageIntro } from "@/components/dashboard-page-intro";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

type DashboardShellProps = {
  userEmail: string;
  children: React.ReactNode;
};

export function DashboardShell({ userEmail, children }: DashboardShellProps) {
  return (
    <main className="dashboard-layout px-4 py-6 md:px-0 md:py-0">
      <div className="dashboard-sidebar-rail">
        <DashboardSidebar userEmail={userEmail} />
      </div>

      <section className="dashboard-main py-6 md:py-8">
        <div className="panel overflow-hidden rounded-[2rem]">
          <div className="min-w-0">
            <div className="border-b border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,253,249,0.9),rgba(255,249,241,0.65))] px-6 py-5 md:px-8">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
                    Searchable control plane
                  </p>
                  <DashboardPageIntro />
                </div>

                <div className="flex flex-col gap-3 xl:items-end">
                  <div className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm text-[var(--foreground)]">
                    Signed in as {userEmail}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/"
                      className="rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
                    >
                      Marketing page
                    </Link>
                    <form action={signOutAction}>
                      <button
                        type="submit"
                        className="rounded-full border border-[var(--border)] bg-white/70 px-4 py-2 text-sm font-semibold text-[var(--foreground)] transition hover:bg-white"
                      >
                        Sign out
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid px-6 py-6 md:px-8">{children}</div>
          </div>
        </div>
      </section>
    </main>
  );
}
