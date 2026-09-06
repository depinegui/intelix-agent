import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());
  const { indexKnowledgeBase } = await import("@/services/knowledge-rag-service");
  const startedAt = Date.now();
  let skippedSinceLastLog = 0;

  console.log("[import] Iniciando sincronização da base legada para o PostgreSQL.");

  const result = await indexKnowledgeBase({
    onProgress(progress) {
      const prefix = progress.current && progress.total
        ? `[import ${progress.current}/${progress.total}]`
        : "[import]";

      if (progress.phase === "document" && progress.message === "Lendo e comparando hash.") {
        return;
      }

      if (progress.phase === "document" && progress.message.startsWith("Ignorado:")) {
        skippedSinceLastLog += 1;
        if (progress.current !== progress.total && skippedSinceLastLog < 10) return;
        console.log(`${prefix} ${progress.document}: ${skippedSinceLastLog} documento(s) inalterado(s) ignorado(s).`);
        skippedSinceLastLog = 0;
        return;
      }

      console.log(`${prefix}${progress.document ? ` ${progress.document}:` : ""} ${progress.message}`);
    },
  });

  console.log(`[import] Documentos encontrados: ${result.documentsFound ?? result.filesProcessed}`);
  console.log(`[import] Documentos importados/atualizados: ${result.documentsImported ?? result.filesProcessed}`);
  console.log(`[import] Documentos ignorados: ${result.documentsSkipped ?? 0}`);
  console.log(`[import] Documentos com erro: ${result.documentsWithError ?? 0}`);
  console.log(`[import] Chunks gerados: ${result.chunksIndexed}`);
  console.log("Fonte persistente: PostgreSQL (KnowledgeDocument e KnowledgeChunk).");
  console.log(`[import] Concluído em ${((Date.now() - startedAt) / 1000).toFixed(1)}s.`);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha ao importar a base legada.");
  process.exit(1);
});
