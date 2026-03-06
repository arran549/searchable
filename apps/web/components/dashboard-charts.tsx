"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo, useState } from "react";

import type { DashboardPageSummary, DashboardPlatform, DashboardTimelinePoint } from "@/lib/dashboard";

const chartPalette = ["#c7652b", "#156a56", "#1f4f85", "#6f4d8d", "#7d5b2f", "#3ecf8e"];

function ChartEmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-[280px] items-center justify-center rounded-[1.5rem] border border-[var(--border)] bg-white/55 px-6 text-center text-sm leading-7 text-[var(--muted-foreground)]">
      {message}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  labelSuffix,
  showAllSeries = false,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { visits?: number }; name?: string; color?: string }>;
  label?: string;
  labelSuffix?: string;
  showAllSeries?: boolean;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const value = payload[0]?.value ?? payload[0]?.payload?.visits ?? 0;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white/95 px-3 py-2 shadow-[var(--shadow)]">
      {label ? (
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">{label}</p>
      ) : null}
      {showAllSeries ? (
        <div className="mt-2 space-y-1">
          {payload
            .filter((entry) => (entry.value ?? 0) > 0)
            .sort((left, right) => (right.value ?? 0) - (left.value ?? 0))
            .map((entry) => (
              <p key={entry.name} className="text-xs font-medium text-[var(--foreground)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span>{entry.name}</span>
                </span>{" "}
                <span className="font-semibold">{entry.value ?? 0}</span>
              </p>
            ))}
        </div>
      ) : (
        <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
          {value} visits{labelSuffix ? ` ${labelSuffix}` : ""}
        </p>
      )}
    </div>
  );
}

export function TimelineLineChart({
  points,
  caption,
}: {
  points: DashboardTimelinePoint[];
  caption: string;
}) {
  if (!points.length) {
    return (
      <ChartEmptyState message="No trend data yet for the selected filters. Expand the range or remove filters to see event movement over time." />
    );
  }

  const [mode, setMode] = useState<"aggregate" | "platform">("aggregate");
  const platformKeys = useMemo(
    () =>
      Array.from(new Set(points.flatMap((point) => Object.keys(point.platformVisits))))
        .sort((left, right) => left.localeCompare(right)),
    [points],
  );
  const supportsPlatformSeries = platformKeys.length > 1;
  const seriesData = useMemo(
    () =>
      points.map((point) => ({
        ...Object.fromEntries(platformKeys.map((platform) => [platform, 0])),
        label: point.label,
        visits: point.visits,
        ...point.platformVisits,
      })),
    [platformKeys, points],
  );
  const effectiveMode = supportsPlatformSeries ? mode : "aggregate";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-[var(--muted-foreground)]">{caption}</p>
        <div className="inline-flex rounded-full border border-[var(--border)] bg-white/75 p-1">
          <button
            type="button"
            onClick={() => setMode("aggregate")}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-semibold transition",
              effectiveMode === "aggregate"
                ? "bg-[var(--accent)] text-[#0a1014]"
                : "text-[var(--foreground)] hover:bg-white",
            ].join(" ")}
          >
            Aggregate
          </button>
          <button
            type="button"
            onClick={() => setMode("platform")}
            disabled={!supportsPlatformSeries}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-semibold transition",
              effectiveMode === "platform"
                ? "bg-[var(--accent)] text-[#0a1014]"
                : "text-[var(--foreground)] hover:bg-white",
              !supportsPlatformSeries ? "cursor-not-allowed opacity-50 hover:bg-transparent" : "",
            ].join(" ")}
          >
            By platform
          </button>
        </div>
      </div>
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seriesData} margin={{ top: 12, right: 12, bottom: 4, left: -24 }}>
              <CartesianGrid stroke="rgba(17,24,28,0.08)" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "#5a6762", fontSize: 12 }} />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#5a6762", fontSize: 12 }}
              />
              <Tooltip content={<ChartTooltip labelSuffix="in bucket" showAllSeries={effectiveMode === "platform"} />} />
              {effectiveMode === "aggregate" ? (
                <Line
                  type="monotone"
                  dataKey="visits"
                  stroke="#c7652b"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#c7652b", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#132230", stroke: "#fff", strokeWidth: 2 }}
                />
              ) : (
                platformKeys.map((platform, index) => (
                  <Line
                    key={platform}
                    type="monotone"
                    dataKey={platform}
                    name={platform}
                    stroke={chartPalette[index % chartPalette.length]}
                    strokeWidth={2.25}
                    dot={{ r: 3, fill: chartPalette[index % chartPalette.length], strokeWidth: 0 }}
                    activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
                  />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export function PlatformShareChart({ platforms }: { platforms: DashboardPlatform[] }) {
  if (!platforms.length) {
    return (
      <ChartEmptyState message="No crawler traffic has been recorded yet. Register a site, install a snippet, and send a test event through Bruno or the tracker endpoint." />
    );
  }

  const total = platforms.reduce((sum, item) => sum + item.visits, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={platforms}
                dataKey="visits"
                nameKey="name"
                innerRadius={58}
                outerRadius={92}
                paddingAngle={3}
              >
                {platforms.map((platform, index) => (
                  <Cell key={platform.name} fill={chartPalette[index % chartPalette.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 rounded-2xl border border-[var(--border)] bg-white/75 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted-foreground)]">Total visits</p>
          <p className="mt-1 text-3xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">{total}</p>
        </div>
      </div>

      <div className="space-y-3">
        {platforms.map((platform, index) => {
          const share = Math.round((platform.visits / Math.max(total, 1)) * 100);
          return (
            <div
              key={platform.name}
              className="flex items-center justify-between rounded-[1.25rem] border border-[var(--border)] bg-white/60 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span
                  className="inline-flex h-3 w-3 rounded-full"
                  style={{ backgroundColor: chartPalette[index % chartPalette.length] }}
                />
                <div>
                  <p className="text-sm font-semibold text-[var(--foreground)]">{platform.name}</p>
                  <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">{share}% share</p>
                </div>
              </div>
              <p className="text-sm font-semibold text-[var(--foreground)]">{platform.visits}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PageVolumeChart({ pages, limit = 6 }: { pages: DashboardPageSummary[]; limit?: number }) {
  const visiblePages = pages.slice(0, limit).map((page) => ({
    ...page,
    shortLabel: page.path.length > 22 ? `${page.path.slice(0, 22)}...` : page.path,
  }));

  if (!visiblePages.length) {
    return (
      <ChartEmptyState message="Once crawler events arrive, this section will rank the most visited pages across your registered sites." />
    );
  }

  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
      <div className="h-[320px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={visiblePages} layout="vertical" margin={{ top: 8, right: 12, bottom: 8, left: 32 }}>
            <CartesianGrid stroke="rgba(17,24,28,0.08)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#5a6762", fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="shortLabel"
              width={110}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#5a6762", fontSize: 12 }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="visits" radius={[0, 10, 10, 0]} fill="#156a56" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
