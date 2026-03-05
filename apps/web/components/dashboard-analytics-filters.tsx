"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";

import type { DashboardDateRange, DashboardTrafficScope } from "@/lib/dashboard";

type DashboardAnalyticsFiltersProps = {
  selectedDateRange: DashboardDateRange;
  trafficScope: DashboardTrafficScope;
  selectedPlatform?: string;
  selectedBotType?: string;
  platforms: string[];
  botTypes: string[];
};

export function DashboardAnalyticsFilters({
  selectedDateRange,
  trafficScope,
  selectedPlatform,
  selectedBotType,
  platforms,
  botTypes,
}: DashboardAnalyticsFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(key: "range" | "traffic" | "platform" | "botType", value: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "all" && key !== "traffic") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? (`${pathname}?${query}` as never) : (pathname as never), { scroll: false });
    });
  }

  return (
    <div className="panel rounded-[1.5rem] p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          Filters
        </p>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect
            label="Date range"
            value={selectedDateRange}
            onChange={(next) => onChange("range", next)}
            options={[
              { value: "24h", label: "Last 24 hours" },
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
            ]}
          />
          <FilterSelect
            label="Traffic"
            value={trafficScope}
            onChange={(next) => onChange("traffic", next)}
            options={[
              { value: "ai", label: "AI crawlers only" },
              { value: "all", label: "All page access" },
            ]}
          />
          <FilterSelect
            label="Platform"
            value={selectedPlatform ?? "all"}
            onChange={(next) => onChange("platform", next)}
            options={[
              { value: "all", label: "All platforms" },
              ...platforms.map((platform) => ({
                value: platform,
                label: platform,
              })),
            ]}
          />
          <FilterSelect
            label="Bot type"
            value={selectedBotType ?? "all"}
            onChange={(next) => onChange("botType", next)}
            options={[
              { value: "all", label: "All bot types" },
              ...botTypes.map((botType) => ({
                value: botType,
                label: botType,
              })),
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-white/70 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-[130px] rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--foreground)] outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
