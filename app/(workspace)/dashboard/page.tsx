import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getDashboardSnapshot } from "@/services/dashboard-service";

export default async function DashboardPage() {
  const snapshot = await getDashboardSnapshot();

  return <DashboardView snapshot={snapshot} />;
}
