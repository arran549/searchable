"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition } from "react";

type ScopeOption = {
  id: string;
  label: string;
};

type SiteScopeFilterProps = {
  options: ScopeOption[];
  selectedSiteId?: string;
};

export function SiteScopeFilter({ options, selectedSiteId }: SiteScopeFilterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = selectedSiteId ?? "all";

  function onChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (next === "all") {
      params.delete("site");
    } else {
      params.set("site", next);
    }

    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  return (
    <label className="inline-flex items-center gap-3 rounded-xl border border-[var(--border)] bg-white/70 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        Scope
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-[190px] rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-sm text-[var(--foreground)] outline-none"
      >
        <option value="all">All sites</option>
        {options.map((site) => (
          <option key={site.id} value={site.id}>
            {site.label}
          </option>
        ))}
      </select>
    </label>
  );
}
