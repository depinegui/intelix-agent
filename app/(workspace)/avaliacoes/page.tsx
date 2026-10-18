import { EvaluationsView } from "@/components/evaluation/evaluations-view";
import { requirePermission } from "@/lib/session";

export default async function EvaluationsPage() {
  await requirePermission("VIEW_EVALUATIONS");

  return <EvaluationsView />;
}
