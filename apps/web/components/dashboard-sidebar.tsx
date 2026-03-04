"use client";

import { DashboardNav } from "@/components/dashboard-nav";

type DashboardSidebarProps = {
  userEmail: string;
};

export function DashboardSidebar({ userEmail }: DashboardSidebarProps) {
  return (
    <aside
      className="dashboard-sidebar w-full rounded-[1.75rem] border border-[#243039] bg-[linear-gradient(180deg,#0f1720_0%,#111b24_58%,#0c141c_100%)] text-white shadow-[0_24px_60px_rgba(8,14,20,0.42)]"
    >
      <div className="dashboard-sidebar-inner flex h-full flex-col">
        <div className="border-b border-white/8 px-4 py-4 md:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#7be6b4]">
                Searchable
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Crawler Cloud</h2>
              <p className="mt-2 text-sm leading-6 text-[#9aa9a2]">
                Product analytics for AI search, assistant, and training crawlers.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#9aa9a2]">
              Workspace
            </p>
            <p className="mt-2 text-sm font-medium text-white">{userEmail}</p>
            <p className="mt-2 text-sm text-[#9aa9a2]">Domain instrumentation and crawler QA in one place.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-medium text-[#b9c4bf]">
                Domains
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-medium text-[#b9c4bf]">
                Installs
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[11px] font-medium text-[#b9c4bf]">
                Activity
              </span>
            </div>
          </div>
        </div>

        <div className="dashboard-sidebar-nav flex-1 px-3 py-4 md:px-4">
          <DashboardNav />
        </div>

        <div className="border-t border-white/10 px-4 py-4 md:px-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7be6b4]">
              Why it exists
            </p>
            <p className="mt-2 text-sm leading-6 text-[#b9c4bf]">
              Searchable helps modern teams see which AI crawlers are reaching their content, where
              they land, and how install quality affects coverage.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
