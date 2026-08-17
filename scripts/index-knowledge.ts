import { loadEnvConfig } from "@next/env";

async function main() {
  loadEnvConfig(process.cwd());

  const [{ indexKnowledgeBase }, { getOpenAiConfigurationMessage }] =
    await Promise.all([
      import("@/services/knowledge-rag-service"),
      import("@/lib/openai"),
    ]);

  try {
    const result = await indexKnowledgeBase();

    console.log(`Arquivos processados: ${result.filesProcessed}`);
    console.log(`Registros encontrados: ${result.recordsFound}`);
    console.log(`Registros indexados: ${result.recordsIndexed}`);
    console.log(`Trechos indexados: ${result.chunksIndexed}`);
    console.log(`Pasta monitorada: ${result.knowledgeDirectory}`);
    console.log(`Indice gerado em: ${result.indexFile}`);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === getOpenAiConfigurationMessage()
    ) {
      console.error(error.message);
      process.exit(1);
    }

    console.error(
      error instanceof Error
        ? error.message
        : "Nao foi possivel indexar a base de conhecimento.",
    );
    process.exit(1);
  }
}

void main();
