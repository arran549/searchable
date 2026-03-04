import { DashboardShell } from "@/components/dashboard-shell";
import { requireDashboardSession } from "@/lib/dashboard";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user } = await requireDashboardSession();

  return <DashboardShell userEmail={user.email ?? "Unknown user"}>{children}</DashboardShell>;
}
