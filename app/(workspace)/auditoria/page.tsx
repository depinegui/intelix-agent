import { AuditView } from "@/components/audit/audit-view";
import { requirePermission } from "@/lib/session";

export default async function AuditPage() {
  await requirePermission("VIEW_AUDIT");
  return <AuditView />;
}
