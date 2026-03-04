"use client";

import { DashboardNav } from "@/components/dashboard-nav";

type DashboardSidebarProps = {
  userEmail: string;
};

export function DashboardSidebar({ userEmail }: DashboardSidebarProps) {
  return (
    <aside
      className="dashboard-sidebar w-full rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#132230_0%,#173248_58%,#112535_100%)] text-white shadow-[0_28px_70px_rgba(8,18,28,0.45)]"
    >
      <div className="dashboard-sidebar-inner flex h-full flex-col">
        <div className="border-b border-white/10 px-4 py-4 md:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d6bfaa]">
                Searchable
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Crawler Cloud</h2>
              <p className="mt-2 text-sm leading-6 text-[#d6bfaa]">
                Product analytics for AI search, assistant, and training crawlers.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/8 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#d6bfaa]">
              Workspace
            </p>
            <p className="mt-2 text-sm font-medium text-white">{userEmail}</p>
            <p className="mt-2 text-sm leading-6 text-[#d6bfaa]">
              Instrument owned domains, validate installs, and review crawler behavior from one
              operating surface.
            </p>
          </div>
        </div>

        <div className="dashboard-sidebar-nav flex-1 px-3 py-4 md:px-4">
          <DashboardNav />
        </div>

        <div className="border-t border-white/10 px-4 py-4 md:px-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/12 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d6bfaa]">
              Why it exists
            </p>
            <p className="mt-2 text-sm leading-6 text-[#dfe8ef]">
              Searchable helps modern teams see which AI crawlers are reaching their content, where
              they land, and how install quality affects coverage.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
