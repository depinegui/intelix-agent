import { KnowledgeView } from "@/components/knowledge/knowledge-view";
import { hasPermission } from "@/lib/permissions";
import { requirePermission } from "@/lib/session";
import { getKnowledgeOverview } from "@/services/knowledge-service";

export default async function KnowledgeBasePage() {
  const user = await requirePermission("VIEW_KNOWLEDGE");
  const overview = await getKnowledgeOverview();

  return (
    <KnowledgeView
      initialDocuments={overview.documents}
      stats={overview.stats}
      canManage={hasPermission(user, "MANAGE_KNOWLEDGE")}
      canDelete={hasPermission(user, "DELETE_KNOWLEDGE")}
    />
  );
}
