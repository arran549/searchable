"use client";

import { usePathname } from "next/navigation";

const introByRoute = [
  {
    href: "/dashboard/settings",
    title: "Configure installation and team defaults.",
    description:
      "Manage snippet setup, verification status, and dashboard behavior so tracking stays consistent across all owned properties.",
  },
  {
    href: "/dashboard/activity",
    title: "Review live crawler activity and trends.",
    description:
      "Inspect recent crawler requests, platform behavior, and event velocity so you can spot shifts in traffic quality quickly.",
  },
  {
    href: "/dashboard/pages",
    title: "Identify the pages AI crawlers prioritize.",
    description:
      "Track top crawled URLs, coverage depth, and page-level visibility to understand how your content is being discovered.",
  },
  {
    href: "/dashboard/platforms",
    title: "Compare crawler platforms and share of traffic.",
    description:
      "Break down activity by AI ecosystem to see where engagement is growing and where instrumentation quality needs attention.",
  },
  {
    href: "/dashboard/sites",
    title: "Manage domains and installation readiness.",
    description:
      "Onboard and verify sites, confirm snippet coverage, and keep domain ownership and deployment state organized.",
  },
  {
    href: "/dashboard",
    title: "Professional analytics for AI crawler visibility.",
    description:
      "Built for a startup workflow: onboard a domain, deploy the install snippet, and monitor platform reach, page coverage, and crawl activity with clear proof.",
  },
] as const;

export function DashboardPageIntro() {
  const pathname = usePathname();

  const intro =
    introByRoute.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ??
    introByRoute[introByRoute.length - 1];

  return (
    <>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] md:text-5xl">{intro.title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] md:text-base">
        {intro.description}
      </p>
    </>
  );
}
