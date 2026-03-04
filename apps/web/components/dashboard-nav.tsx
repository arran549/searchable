"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const dashboardNavItems = [
  {
    href: "/dashboard",
    label: "Overview",
    shortLabel: "OV",
    summary: "Executive pulse",
  },
  {
    href: "/dashboard/sites",
    label: "Sites",
    shortLabel: "SI",
    summary: "Domains and ownership",
  },
  {
    href: "/dashboard/platforms",
    label: "Platforms",
    shortLabel: "PL",
    summary: "Bot mix and share",
  },
  {
    href: "/dashboard/pages",
    label: "Pages",
    shortLabel: "PG",
    summary: "Top crawled URLs",
  },
  {
    href: "/dashboard/activity",
    label: "Activity",
    shortLabel: "AC",
    summary: "Recent event stream",
  },
  {
    href: "/dashboard/settings",
    label: "Settings",
    shortLabel: "ST",
    summary: "Site install and config",
  },
] as const;

export function DashboardNav({
  collapsed = false,
}: {
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2">
      {dashboardNavItems.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "group flex items-center gap-3 rounded-[1.25rem] border px-3 py-3 text-sm transition",
              active
                ? "border-white/15 bg-white/12 text-white"
                : "border-transparent text-[#d6bfaa] hover:border-white/10 hover:bg-white/6 hover:text-white",
              collapsed ? "justify-center" : "",
            ].join(" ")}
            title={collapsed ? item.label : undefined}
          >
            <span
              className={[
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[11px] font-semibold uppercase tracking-[0.16em]",
                active
                  ? "border-white/12 bg-white/12 text-white"
                  : "border-white/10 bg-black/10 text-[#f3dfcd]",
              ].join(" ")}
            >
              {item.shortLabel}
            </span>

            {!collapsed ? (
              <span className="min-w-0">
                <span className="block font-semibold text-white">{item.label}</span>
                <span className="block truncate text-xs text-[#d6bfaa]">{item.summary}</span>
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
