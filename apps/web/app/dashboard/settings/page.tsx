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

      <section className="grid gap-4 xl:grid-cols-[0.84fr_1.16fr]">
        <SiteRegistrationCard />

        <article className="panel rounded-[1.5rem] p-5">
          <SectionHeading
            eyebrow="Install"
            title="Generated snippets per site"
            description="Each registered site gets its own tracking token and install code. The script is the default path; the pixel is the fallback."
            meta="Script-first with HTML fallback"
          />
          <InstallSnippetGrid sites={data.sites} supabaseUrl={env.NEXT_PUBLIC_SUPABASE_URL} />
        </article>
      </section>
    </div>
  );
}
