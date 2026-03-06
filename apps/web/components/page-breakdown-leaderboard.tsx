"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { DashboardEvent, DashboardPageSummary } from "@/lib/dashboard";

type PageBreakdownLeaderboardProps = {
  pages: DashboardPageSummary[];
  events: DashboardEvent[];
  limit?: number;
};

type TimeWindow = "24h" | "7d" | "30d" | "all";

const chartPalette = ["#c7652b", "#156a56", "#1f4f85", "#6f4d8d", "#7d5b2f", "#3ecf8e"];

export function PageBreakdownLeaderboard({ pages, events, limit }: PageBreakdownLeaderboardProps) {
  const visiblePages = typeof limit === "number" ? pages.slice(0, limit) : pages;
  const [open, setOpen] = useState(false);
  const [selectedPagePath, setSelectedPagePath] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("all");
  const [window, setWindow] = useState<TimeWindow>("7d");
  const dialogRef = useRef<HTMLDialogElement>(null);

  const eventsByPage = useMemo(() => {
    return events.reduce((accumulator, event) => {
      const key = event.page_path || event.page_url;
      const pageEvents = accumulator.get(key) ?? [];
      pageEvents.push(event);
      accumulator.set(key, pageEvents);
      return accumulator;
    }, new Map<string, DashboardEvent[]>());
  }, [events]);

  const selectedPage = selectedPagePath ? pages.find((page) => page.path === selectedPagePath) ?? null : null;
  const selectedPageEvents = selectedPagePath ? eventsByPage.get(selectedPagePath) ?? [] : [];
  const filteredEvents = selectedPlatform === "all"
    ? selectedPageEvents
    : selectedPageEvents.filter((event) => event.platform === selectedPlatform);

  const platformBreakdown = useMemo(() => {
    const totalVisits = selectedPageEvents.length;
    return Array.from(
      selectedPageEvents.reduce((accumulator, event) => {
        const key = event.platform || "Unknown";
        accumulator.set(key, (accumulator.get(key) ?? 0) + 1);
        return accumulator;
      }, new Map<string, number>()),
    )
      .map(([platform, visits], index) => ({
        platform,
        visits,
        share: Math.round((visits / Math.max(totalVisits, 1)) * 100),
        color: chartPalette[index % chartPalette.length],
      }))
      .sort((left, right) => right.visits - left.visits);
  }, [selectedPageEvents]);

  const timelinePoints = useMemo(() => {
    const now = new Date();
    const windowed = filterByWindow(filteredEvents, window, now);

    if (window === "24h") {
      const buckets: Array<{ label: string; visits: number }> = [];
      for (let offset = 23; offset >= 0; offset -= 1) {
        const bucketStart = new Date(now);
        bucketStart.setMinutes(0, 0, 0);
        bucketStart.setHours(bucketStart.getHours() - offset);
        const bucketEnd = new Date(bucketStart);
        bucketEnd.setHours(bucketEnd.getHours() + 1);
        const visits = windowed.reduce((count, event) => {
          const occurredAt = new Date(event.occurred_at).getTime();
          return occurredAt >= bucketStart.getTime() && occurredAt < bucketEnd.getTime() ? count + 1 : count;
        }, 0);
        buckets.push({
          label: bucketStart.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
          visits,
        });
      }

      return buckets;
    }

    const dayCount = window === "7d" ? 7 : window === "30d" ? 30 : resolveAllDayCount(windowed, now);
    const buckets: Array<{ label: string; visits: number }> = [];
    for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
      const bucketStart = new Date(now);
      bucketStart.setHours(0, 0, 0, 0);
      bucketStart.setDate(bucketStart.getDate() - offset);
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + 1);
      const visits = windowed.reduce((count, event) => {
        const occurredAt = new Date(event.occurred_at).getTime();
        return occurredAt >= bucketStart.getTime() && occurredAt < bucketEnd.getTime() ? count + 1 : count;
      }, 0);
      buckets.push({
        label: bucketStart.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
        visits,
      });
    }

    return buckets;
  }, [filteredEvents, window]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    function handleClose() {
      setOpen(false);
    }

    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, []);

  useEffect(() => {
    setSelectedPlatform("all");
    setWindow("7d");
  }, [selectedPagePath]);

  if (!visiblePages.length) {
    return (
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-5 text-sm leading-7 text-[var(--muted-foreground)]">
        Once crawler events arrive, this section will rank the most visited pages across your registered sites.
      </div>
    );
  }

  const firstSeen = selectedPageEvents.at(-1)?.occurred_at;
  const lastSeen = selectedPageEvents[0]?.occurred_at;

  return (
    <>
      <div className="space-y-3">
        {visiblePages.map((page, index) => (
          <div
            key={page.path}
            className="grid gap-3 rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4 md:grid-cols-[auto_1fr_auto]"
          >
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#132230] text-sm font-semibold text-white">
              {index + 1}
            </div>
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-mono)] text-sm font-medium">
                {page.path}
              </p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">Site: {page.site}</p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Dominant crawler: {page.bot} / Platform: {page.platform}
              </p>
            </div>
            <div className="text-right">
              <button
                type="button"
                onClick={() => {
                  setSelectedPagePath(page.path);
                  setOpen(true);
                }}
                className="inline-flex cursor-pointer items-end justify-end rounded-lg border border-[var(--border)] bg-white/75 px-3 py-1 transition hover:bg-white"
                aria-label={`Open visit details for ${page.path}`}
              >
                <span className="text-2xl font-semibold tracking-[-0.03em]">{page.visits}</span>
              </button>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                visits
              </p>
            </div>
          </div>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="page-visit-breakdown-title"
        className="m-auto w-[min(1080px,calc(100vw-2rem))] border-0 bg-transparent p-0 backdrop:bg-[#12212f]/35 backdrop:backdrop-blur-[2px]"
        onClick={(event) => {
          if (event.target === dialogRef.current) {
            setOpen(false);
          }
        }}
      >
        <div className="flex max-h-[90vh] flex-col gap-3">
          <section className="panel shrink-0 rounded-[1.75rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(247,249,248,0.98))] px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
                  Page visit breakdown
                </p>
                <h3 id="page-visit-breakdown-title" className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
                  {selectedPage?.path ?? "No page selected"}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
                  Inspect crawler platforms and timing patterns for this page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-[var(--border)] bg-white/80 px-3 py-2 text-sm font-medium text-[var(--foreground)] transition hover:bg-white"
              >
                Close
              </button>
            </div>
          </section>

          <article className="panel min-h-0 flex-1 overflow-y-auto rounded-[1.75rem] p-5 [scrollbar-width:thin] [scrollbar-color:rgba(19,34,48,0.45)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(19,34,48,0.45)] [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(19,34,48,0.65)] md:p-6">
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard label="Total visits" value={String(selectedPageEvents.length)} />
              <SummaryCard label="Platforms" value={String(platformBreakdown.length)} />
              <SummaryCard label="First seen" value={firstSeen ? formatTimestamp(firstSeen) : "-"} />
              <SummaryCard label="Last seen" value={lastSeen ? formatTimestamp(lastSeen) : "-"} />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[{ label: "All platforms", value: "all" }, ...platformBreakdown.map((item) => ({
                label: item.platform,
                value: item.platform,
              }))].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedPlatform(item.value)}
                  className={[
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    selectedPlatform === item.value
                      ? "border-[#132230] bg-[#132230] text-white"
                      : "border-[var(--border)] bg-white/75 text-[var(--foreground)] hover:bg-white",
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
              <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Platform distribution
                </p>
                <div className="mt-3 h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={platformBreakdown} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 24 }}>
                      <CartesianGrid stroke="rgba(17,24,28,0.08)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="platform" width={120} tickLine={false} axisLine={false} />
                      <Tooltip content={<BreakdownTooltip valueSuffix="visits" />} />
                      <Bar dataKey="visits" radius={[0, 8, 8, 0]}>
                        {platformBreakdown.map((item) => (
                          <Cell key={item.platform} fill={item.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 grid gap-2">
                  {platformBreakdown.map((item) => (
                    <div
                      key={item.platform}
                      className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-white/70 px-3 py-2"
                    >
                      <p className="text-sm font-medium">{item.platform}</p>
                      <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                        {item.visits} visits / {item.share}%
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Visit timing
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["24h", "7d", "30d", "all"] as TimeWindow[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setWindow(option)}
                        className={[
                          "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] transition",
                          window === option
                            ? "border-[#132230] bg-[#132230] text-white"
                            : "border-[var(--border)] bg-white/75 text-[var(--foreground)] hover:bg-white",
                        ].join(" ")}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-3 h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={timelinePoints} margin={{ top: 8, right: 12, bottom: 4, left: -24 }}>
                      <CartesianGrid stroke="rgba(17,24,28,0.08)" vertical={false} />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#5a6762", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#5a6762", fontSize: 12 }} />
                      <Tooltip content={<BreakdownTooltip valueSuffix="visits" />} />
                      <Line
                        type="monotone"
                        dataKey="visits"
                        stroke="#c7652b"
                        strokeWidth={3}
                        dot={{ r: 3, fill: "#c7652b", strokeWidth: 0 }}
                        activeDot={{ r: 6, fill: "#132230", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-3 text-sm text-[var(--muted-foreground)]">
                  Showing {selectedPlatform === "all" ? "all platforms" : selectedPlatform} for {window}.
                </p>
              </section>
            </div>

            <section className="mt-5 rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Recent visits in selection
              </p>
              <div className="mt-3 max-h-[220px] overflow-auto rounded-xl border border-[var(--border)] bg-white/80 [scrollbar-width:thin] [scrollbar-color:rgba(19,34,48,0.45)_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(19,34,48,0.45)] [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(19,34,48,0.65)]">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-white/90">
                    <tr>
                      <th className="sticky top-0 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                        Time
                      </th>
                      <th className="sticky top-0 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                        Platform
                      </th>
                      <th className="sticky top-0 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
                        Bot
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filterByWindow(filteredEvents, window, new Date()).slice(0, 50).map((event) => (
                      <tr key={event.id}>
                        <td className="border-b border-[var(--border)] px-3 py-2 whitespace-nowrap text-[var(--muted-foreground)]">
                          {formatTimestamp(event.occurred_at)}
                        </td>
                        <td className="border-b border-[var(--border)] px-3 py-2">{event.platform}</td>
                        <td className="border-b border-[var(--border)] px-3 py-2">{event.bot_name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </article>
        </div>
      </dialog>
    </>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--border)] bg-white/70 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function BreakdownTooltip({
  active,
  payload,
  label,
  valueSuffix,
}: {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
  valueSuffix: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/95 px-3 py-2 shadow-[var(--shadow)]">
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</p>
      ) : null}
      <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
        {payload[0]?.value ?? 0} {valueSuffix}
      </p>
    </div>
  );
}

function resolveAllDayCount(events: DashboardEvent[], now: Date) {
  if (!events.length) {
    return 7;
  }

  const oldest = new Date(events.at(-1)?.occurred_at ?? now.toISOString());
  oldest.setHours(0, 0, 0, 0);
  const current = new Date(now);
  current.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((current.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 7), 60);
}

function filterByWindow(events: DashboardEvent[], window: TimeWindow, now: Date) {
  if (window === "all") {
    return events;
  }

  const windowMs = window === "24h"
    ? 24 * 60 * 60 * 1000
    : window === "7d"
      ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
  const cutoff = now.getTime() - windowMs;

  return events.filter((event) => new Date(event.occurred_at).getTime() >= cutoff);
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
