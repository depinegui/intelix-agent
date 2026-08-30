import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requirePermission } from "@/lib/session";
import { getDashboardSnapshot } from "@/services/dashboard-service";

export default async function DashboardPage() {
  await requirePermission("VIEW_DASHBOARD");
  const snapshot = await getDashboardSnapshot();

  return <DashboardView snapshot={snapshot} />;
}
