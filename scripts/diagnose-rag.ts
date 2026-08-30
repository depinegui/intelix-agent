import { loadEnvConfig } from "@next/env";
import type { KnowledgeSearchDiagnosticEntry } from "@/services/knowledge-rag-service";

loadEnvConfig(process.cwd());

const validationQueries = [
  "Como resolver a rejeicao 204 da NF-e?",
  "Como resolver a rejeicao 301 da NF-e?",
  "Estou com rejeicao 539 por duplicidade.",
  "E se a nota ja estiver autorizada, o que devo fazer?",
  "Como faco para emitir uma NF-e?",
  "Como faco um ajuste de estoque?",
  "Como cadastrar um produto?",
  "Como emitir boleto no sistema?",
];
const queries = process.argv.slice(2);

function printEntry(entry: KnowledgeSearchDiagnosticEntry) {
  console.log(
    JSON.stringify({
      title: entry.title,
      source: entry.source,
      score: Number(entry.score.toFixed(4)),
      semanticScore: Number(entry.semanticScore.toFixed(4)),
      lexicalScore: Number(entry.lexicalScore.toFixed(4)),
      codeAdjustment: entry.codeAdjustment,
      titleIntent: entry.titleIntent,
      intentAdjustment: entry.intentAdjustment,
      category: entry.category,
      categoryAdjustment: entry.categoryAdjustment,
      decision: entry.decision,
    }),
  );
}

async function main() {
  const { diagnoseKnowledgeSearch } = await import(
    "@/services/knowledge-rag-service"
  );

  for (const query of queries.length ? queries : validationQueries) {
    const diagnostic = await diagnoseKnowledgeSearch(query, 4);
    console.log(`\nQuery: ${diagnostic.query}`);
    console.log(
      `Intencao: ${diagnostic.queryIntent}; categoria: ${diagnostic.queryCategory ?? "n/a"}; tokens: ${diagnostic.queryTokens.join(", ") || "n/a"}; piso minimo: ${diagnostic.minimumScore}; piso relativo: ${diagnostic.relativeScoreFloor?.toFixed(4) ?? "n/a"}`,
    );

    diagnostic.entries
      .filter((entry) => entry.decision === "approved")
      .forEach(printEntry);

    const discarded = diagnostic.entries.filter(
      (entry) => entry.decision !== "approved",
    );
    console.log(`Descartados: ${discarded.length}`);
    discarded.slice(0, 10).forEach(printEntry);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
