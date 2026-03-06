import { CopyButton } from "@/components/copy-button";
import { PageVolumeChart, PlatformShareChart, TimelineLineChart } from "@/components/dashboard-charts";
import { SiteInstallDialog } from "@/components/site-install-dialog";
import { SiteRegistrationDialog } from "@/components/site-registration-dialog";
import { SiteVerificationDialog } from "@/components/site-verification-dialog";
import { SiteScopeFilter } from "@/components/site-scope-filter";
import { updateSiteTrafficLoggingAction } from "@/app/dashboard/actions";
import type {
  DashboardEvent,
  DashboardPageSummary,
  DashboardPlatform,
  DashboardSite,
  DashboardTimelinePoint,
} from "@/lib/dashboard";
import { formatRelativeDays, formatTimestamp, stripProtocol } from "@/lib/dashboard";
import { getPixelInstallSnippet, getScriptInstallSnippet } from "@/lib/tracking-snippets";

export function DashboardNotice({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  if (!message && !error) {
    return null;
  }

  return (
    <div className="space-y-3">
      {message ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-[#cf6f2e] bg-[#fff4ea] px-4 py-3 text-sm text-[#9d4511]">
          {error}
        </div>
      ) : null}
    </div>
  );
}

export function AnalyticsScope({
  sites,
  selectedSiteId,
}: {
  sites: DashboardSite[];
  selectedSiteId?: string;
}) {
  const selectedSite = selectedSiteId ? sites.find((site) => site.id === selectedSiteId) ?? null : null;

  return (
    <div className="panel rounded-[1.5rem] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Analytics scope
          </p>
          <p className="mt-1 text-sm text-[var(--foreground)]">
            {selectedSite
              ? `Showing data for ${selectedSite.name || selectedSite.domain}.`
              : "Showing combined data across all registered sites."}
          </p>
        </div>
        <SiteScopeFilter
          options={sites.map((site) => ({
            id: site.id,
            label: site.name ? `${site.name} (${site.domain})` : site.domain,
          }))}
          selectedSiteId={selectedSiteId}
        />
      </div>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  meta,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  meta?: string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] md:text-3xl">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>

      {meta ? (
        <div className="rounded-full border border-[var(--border)] bg-white/60 px-4 py-2 text-sm text-[var(--muted-foreground)]">
          {meta}
        </div>
      ) : null}
    </div>
  );
}

export function StatsGrid({
  stats,
}: {
  stats: Array<{ label: string; value: string; detail: string }>;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article key={stat.label} className="panel rounded-[1.5rem] p-5">
          <p className="mb-2 text-sm text-[var(--muted-foreground)]">{stat.label}</p>
          <p className="text-4xl font-semibold tracking-[-0.04em]">{stat.value}</p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{stat.detail}</p>
        </article>
      ))}
    </div>
  );
}

export function SiteRegistrationCard() {
  return (
    <article className="panel rounded-[1.5rem] p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Onboarding
          </p>
          <h3 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Register a site</h3>
        </div>
        <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
          Required before install
        </span>
      </div>

      <SiteRegistrationDialog />

      <div className="mt-5 grid gap-3">
        {[
          "Create or sign in to an account",
          "Register each domain you control",
          "Copy the generated script or pixel",
          "Install it on the target site",
          "Review events and platform activity here",
        ].map((item, index) => (
          <div
            key={item}
            className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white/55 px-4 py-3 text-sm"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-semibold text-white">
              {index + 1}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

export function PlatformPanel({
  platforms,
}: {
  platforms: DashboardPlatform[];
}) {
  return <PlatformShareChart platforms={platforms} />;
}

export function PageLeaderboard({
  pages,
  limit,
}: {
  pages: DashboardPageSummary[];
  limit?: number;
}) {
  const visiblePages = typeof limit === "number" ? pages.slice(0, limit) : pages;

  if (!visiblePages.length) {
    return (
      <EmptyPanel message="Once crawler events arrive, this section will rank the most visited pages across your registered sites." />
    );
  }

  return (
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
            <p className="text-2xl font-semibold tracking-[-0.03em]">{page.visits}</p>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              visits
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityFeed({
  events,
  limit,
}: {
  events: DashboardEvent[];
  limit?: number;
}) {
  const visibleEvents = typeof limit === "number" ? events.slice(0, limit) : events;

  if (!visibleEvents.length) {
    return (
      <EmptyPanel message="No activity yet. Use the script install, HTML pixel fallback, or Bruno request to seed the first tracked event." />
    );
  }

  return (
    <div className="space-y-3">
      {visibleEvents.map((event) => (
        <div key={event.id} className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-base font-semibold">
                {event.bot_name} / {event.platform}
              </p>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                {event.bot_type} / {event.source}
              </p>
            </div>
            <div className="text-right text-sm text-[var(--muted-foreground)]">
              <p>{formatTimestamp(event.occurred_at)}</p>
              <p>{stripProtocol(event.page_url)}</p>
            </div>
          </div>

          <div className="mt-3 rounded-xl border border-[var(--border)] bg-white/60 px-3 py-2">
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--muted-foreground)]">
              {event.user_agent}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityTable({
  events,
  limit,
}: {
  events: DashboardEvent[];
  limit?: number;
}) {
  const visibleEvents = typeof limit === "number" ? events.slice(0, limit) : events;

  if (!visibleEvents.length) {
    return (
      <EmptyPanel message="No activity yet. Use the script install, HTML pixel fallback, or Bruno request to seed the first tracked event." />
    );
  }

  return (
    <div className="max-h-[560px] overflow-auto rounded-[1.5rem] border border-[var(--border)] bg-white/60">
      <table className="min-w-[920px] w-full border-collapse text-sm">
        <thead className="bg-white/90">
          <tr>
            <th className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Time
            </th>
            <th className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Bot
            </th>
            <th className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Platform
            </th>
            <th className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Type
            </th>
            <th className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Source
            </th>
            <th className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              Page
            </th>
            <th className="sticky top-0 z-10 border-b border-[var(--border)] bg-white/90 px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
              User agent
            </th>
          </tr>
        </thead>
        <tbody>
          {visibleEvents.map((event) => (
            <tr key={event.id} className="align-top">
              <td className="border-b border-[var(--border)] px-3 py-2 text-[var(--muted-foreground)] whitespace-nowrap">
                {formatTimestamp(event.occurred_at)}
              </td>
              <td className="border-b border-[var(--border)] px-3 py-2 font-medium">{event.bot_name}</td>
              <td className="border-b border-[var(--border)] px-3 py-2">{event.platform}</td>
              <td className="border-b border-[var(--border)] px-3 py-2">{event.bot_type}</td>
              <td className="border-b border-[var(--border)] px-3 py-2">{event.source}</td>
              <td className="border-b border-[var(--border)] px-3 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--muted-foreground)]">
                {stripProtocol(event.page_url)}
              </td>
              <td className="border-b border-[var(--border)] px-3 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--muted-foreground)]">
                {event.user_agent}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ActivityTrend({
  points,
  caption,
}: {
  points: DashboardTimelinePoint[];
  caption: string;
}) {
  return <TimelineLineChart points={points} caption={caption} />;
}

export function PageVolumePanel({
  pages,
  limit,
}: {
  pages: DashboardPageSummary[];
  limit?: number;
}) {
  return <PageVolumeChart pages={pages} limit={limit} />;
}

export function InstallSnippetGrid({
  sites,
  supabaseUrl,
}: {
  sites: DashboardSite[];
  supabaseUrl: string;
}) {
  if (!sites.length) {
    return (
      <EmptyPanel message="No sites registered yet. Create one and this section will generate copy-paste install code automatically." />
    );
  }

  return (
    <div className="grid min-w-0 gap-4">
      {sites.map((site) => (
        <article key={site.id} className="panel min-w-0 overflow-x-hidden rounded-[1.5rem] p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-[-0.02em]">{site.name || site.domain}</p>
              <p className="break-all text-sm text-[var(--muted-foreground)]">{site.domain}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                created {formatRelativeDays(site.created_at)}
              </span>
              <span className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--muted-foreground)]">
                {site.verified_at ? "verified" : "unverified"}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <InstallMethodCard
                title="Recommended"
                subtitle="JavaScript tracker"
                body="Best for modern sites. Captures page context and posts through the tracking endpoint."
              />
              <InstallMethodCard
                title="Fallback"
                subtitle="HTML pixel"
                body="Use this for static HTML, CMS blocks, or environments where scripts are harder to inject."
              />
            </div>

            <SnippetBlock
              label="Recommended script"
              code={getScriptInstallSnippet(supabaseUrl, site.tracking_token)}
              copyLabel="Copy script"
            />
            <SnippetBlock
              label="HTML fallback pixel"
              code={getPixelInstallSnippet(supabaseUrl, site.tracking_token)}
              copyLabel="Copy pixel"
            />

            <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                    Tracking token
                  </p>
                  <p className="mt-2 break-all font-[family-name:var(--font-mono)] text-sm text-[var(--foreground)]">
                    {site.tracking_token}
                  </p>
                </div>
                <CopyButton value={site.tracking_token} label="Copy token" />
              </div>
            </div>

          </div>
        </article>
      ))}
    </div>
  );
}

export function SiteList({
  sites,
  supabaseUrl,
  returnTo,
  noticeMessage,
  noticeError,
}: {
  sites: DashboardSite[];
  supabaseUrl: string;
  returnTo?: string;
  noticeMessage?: string;
  noticeError?: string;
}) {
  if (!sites.length) {
    return (
      <EmptyPanel message="No sites registered yet. Create your first domain to generate install code and start collecting crawler events." />
    );
  }

  return (
    <div className="grid gap-3">
      {noticeMessage ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[#ebfbf4] px-4 py-3 text-sm text-[#14523a]">
          {noticeMessage}
        </div>
      ) : null}
      {noticeError ? (
        <div className="rounded-2xl border border-[#cf6f2e] bg-[#fff4ea] px-4 py-3 text-sm text-[#9d4511]">
          {noticeError}
        </div>
      ) : null}
      {sites.map((site) => (
        <article
          key={site.id}
          className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-semibold">{site.name || site.domain}</p>
                <span className="rounded-full border border-[var(--border)] bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {site.latest_event_at ? "Installed" : "Ready to install"}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{site.domain}</p>
              <div className="mt-3 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                <SiteInstallDialog site={site} supabaseUrl={supabaseUrl} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[360px]">
              <div className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Created
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                  {formatRelativeDays(site.created_at)}
                </p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-white/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  Verification
                </p>
                <p className="mt-2 text-sm font-medium text-[var(--foreground)]">
                  {site.verified_at ? "Complete" : "Pending"}
                </p>
                <div className="mt-3">
                  <SiteVerificationDialog site={site} returnTo={returnTo ?? "/dashboard/sites"} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
            <form
              action={updateSiteTrafficLoggingAction}
              className="flex w-full flex-wrap items-center justify-between gap-3"
            >
              <input type="hidden" name="siteId" value={site.id} />
              <input type="hidden" name="returnTo" value={returnTo ?? "/dashboard/sites"} />
              <label className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                <input
                  type="checkbox"
                  name="logNonAiTraffic"
                  value="1"
                  defaultChecked={site.log_non_ai_traffic}
                />
                Log non-AI traffic
              </label>
              <p className="w-full text-xs text-[var(--muted-foreground)]">
                This is the site default. Install snippets can still force non-AI logging off.
              </p>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-[var(--border)] bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {site.log_non_ai_traffic ? "AI + non-AI" : "AI only"}
                </span>
                <button
                  type="submit"
                  className="rounded-full border border-[var(--border)] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--foreground)] transition hover:bg-[#f8fbf9]"
                >
                  Save
                </button>
              </div>
            </form>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[var(--border)] bg-white/75 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Script available
              </span>
              <span className="rounded-full border border-[var(--border)] bg-white/75 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                Pixel fallback available
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

export function SiteSnapshotCards({ sites }: { sites: DashboardSite[] }) {
  const verifiedCount = sites.filter((site) => Boolean(site.verified_at)).length;
  const unverifiedCount = sites.length - verifiedCount;
  const newestSite = sites[0] ?? null;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {[
        {
          label: "Registered sites",
          value: String(sites.length),
          detail: sites.length ? "Domains currently instrumented in the workspace" : "No domains registered yet",
        },
        {
          label: "Verification status",
          value: verifiedCount ? `${verifiedCount} verified` : "0 verified",
          detail: unverifiedCount
            ? `${unverifiedCount} still ready for verification or install`
            : "All registered domains are verified",
        },
        {
          label: "Newest domain",
          value: newestSite?.domain ?? "No sites yet",
          detail: newestSite
            ? `Added ${formatRelativeDays(newestSite.created_at)}`
            : "Create your first site to unlock install snippets",
        },
      ].map((item) => (
        <article key={item.label} className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            {item.label}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">{item.value}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{item.detail}</p>
        </article>
      ))}
    </div>
  );
}

function SnippetBlock({
  label,
  code,
  copyLabel,
}: {
  label: string;
  code: string;
  copyLabel: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          {label}
        </p>
        <CopyButton value={code} label={copyLabel} />
      </div>
      <pre className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-[#fffdf8] p-3 text-xs leading-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-5 text-sm leading-7 text-[var(--muted-foreground)]">
      {message}
    </div>
  );
}

function InstallMethodCard({
  title,
  subtitle,
  body,
}: {
  title: string;
  subtitle: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-white/55 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
        {title}
      </p>
      <p className="mt-2 text-base font-semibold">{subtitle}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{body}</p>
    </div>
  );
}
