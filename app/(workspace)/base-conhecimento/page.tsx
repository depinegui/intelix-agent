import { KnowledgeView } from "@/components/knowledge/knowledge-view";
import { getKnowledgeOverview } from "@/services/knowledge-service";

export default async function KnowledgeBasePage() {
  const overview = await getKnowledgeOverview();

  return (
    <KnowledgeView
      initialDocuments={overview.documents}
      stats={overview.stats}
    />
  );
}
