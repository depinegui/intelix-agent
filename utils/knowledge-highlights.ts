import type {
  KnowledgeCategory,
  KnowledgeDocument,
  KnowledgeHighlight,
} from "@/types";
import { categoryLabels } from "@/utils/format";

const KNOWLEDGE_CATEGORIES: KnowledgeCategory[] = [
  "NF_E",
  "NFC_E",
  "ESTOQUE",
  "INVENTARIO",
  "PCP",
  "PROCEDIMENTOS",
];
const MAX_HIGHLIGHT_TAGS = 3;

export function getKnowledgeHighlights(
  documents: KnowledgeDocument[],
): KnowledgeHighlight[] {
  return KNOWLEDGE_CATEGORIES.map((category) => {
    const categoryDocuments = documents.filter(
      (document) => document.category === category,
    );
    const items = Array.from(
      new Set(categoryDocuments.flatMap((document) => document.tags)),
    ).slice(0, MAX_HIGHLIGHT_TAGS);

    return {
      category,
      label: categoryLabels[category],
      documents: categoryDocuments.length,
      items,
    };
  });
}
