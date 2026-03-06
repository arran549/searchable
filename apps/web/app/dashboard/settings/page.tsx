import { DashboardNotice, InstallSnippetGrid, SectionHeading, SiteRegistrationCard } from "@/components/dashboard-sections";
import { env } from "@/lib/env";
import { getDashboardData } from "@/lib/dashboard";

type DashboardSettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    message?: string;
  }>;
};

export default async function DashboardSettingsPage({
  searchParams,
}: DashboardSettingsPageProps) {
  const { error, message } = await searchParams;
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      <DashboardNotice message={message} error={error} />

      <section className="space-y-4">
        <SiteRegistrationCard />

        <article className="panel min-w-0 overflow-x-hidden rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Install"
            title="Generated snippets per site"
            description="Each registered site gets its own tracking token and install code. The script is the default path; the pixel is the fallback."
            meta="Script-first with HTML fallback"
          />
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            {[
              "Paste the script into the global site template if you want full-page coverage.",
              "Use the pixel when the target environment only supports raw HTML embeds.",
              "After deployment, send a known crawler event and confirm it appears in Activity.",
            ].map((item, index) => (
              <div
                key={item}
                className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-white/55 px-4 py-3 text-sm leading-6 text-[var(--muted-foreground)]"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#132230] text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <InstallSnippetGrid sites={data.sites} supabaseUrl={env.NEXT_PUBLIC_SUPABASE_URL} />
        </article>
      </section>
    </div>
  );
}
