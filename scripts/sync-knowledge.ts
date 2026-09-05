import {
  copyFile,
  mkdir,
  readdir,
  rename,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";


const PROJECT_ROOT = process.cwd();

const DEFAULT_SOURCE_ROOT = path.resolve(
  PROJECT_ROOT,
  "..",
  "intelix-base-conhecimento",
);

const SOURCE_ROOT = process.env.INTELIX_KNOWLEDGE_SOURCE
  ? path.resolve(process.env.INTELIX_KNOWLEDGE_SOURCE)
  : DEFAULT_SOURCE_ROOT;

const SOURCE_KNOWLEDGE = path.join(
  SOURCE_ROOT,
  "knowledge",
);

const SOURCE_OVERRIDES = path.join(
  SOURCE_ROOT,
  "manual-overrides",
);

const SOURCE_TECNOSPEED = path.join(
  SOURCE_ROOT,
  "materiais",
  "tecnospeed",
);

const SOURCE_SPREADSHEETS = path.join(
  SOURCE_ROOT,
  "materiais",
  "planilhas",
);

const TARGET_DIRECTORY = path.join(
  PROJECT_ROOT,
  "knowledge",
);

const STAGING_DIRECTORY = path.join(
  PROJECT_ROOT,
  ".knowledge-sync",
);

const SUPPORTED_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".csv",
  ".pdf",
  ".docx",
  ".xlsx",
]);


async function exists(filePath: string) {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}


async function ensureDirectory(
  directory: string,
) {
  await mkdir(
    directory,
    {
      recursive: true,
    },
  );
}


async function copyDirectory(
  source: string,
  destination: string,
  options?: {
    skipFiles?: Set<string>;
  },
) {
  if (!(await exists(source))) {
    return;
  }

  await ensureDirectory(destination);

  const entries = await readdir(
    source,
    {
      withFileTypes: true,
    },
  );

  for (const entry of entries) {
    if (entry.name.startsWith(".")) {
      continue;
    }

    if (
      options?.skipFiles?.has(entry.name)
    ) {
      continue;
    }

    const sourcePath = path.join(
      source,
      entry.name,
    );

    const destinationPath = path.join(
      destination,
      entry.name,
    );

    if (entry.isDirectory()) {
      await copyDirectory(
        sourcePath,
        destinationPath,
        options,
      );

      continue;
    }

    await ensureDirectory(
      path.dirname(destinationPath),
    );

    await copyFile(
      sourcePath,
      destinationPath,
    );
  }
}


async function countKnowledgeFiles(
  directory: string,
): Promise<number> {
  if (!(await exists(directory))) {
    return 0;
  }

  const entries = await readdir(
    directory,
    {
      withFileTypes: true,
    },
  );

  let count = 0;

  for (const entry of entries) {
    const absolutePath = path.join(
      directory,
      entry.name,
    );

    if (entry.isDirectory()) {
      count += await countKnowledgeFiles(
        absolutePath,
      );

      continue;
    }

    if (
      SUPPORTED_EXTENSIONS.has(
        path.extname(entry.name).toLowerCase(),
      )
    ) {
      count += 1;
    }
  }

  return count;
}


async function main() {
  console.log(
    `Fonte da base: ${SOURCE_ROOT}`,
  );

  if (!(await exists(SOURCE_ROOT))) {
    throw new Error(
      `Repositorio da base nao encontrado: ${SOURCE_ROOT}`,
    );
  }

  if (!(await exists(SOURCE_KNOWLEDGE))) {
    throw new Error(
      `Pasta knowledge nao encontrada em: ${SOURCE_KNOWLEDGE}`,
    );
  }

  await rm(
    STAGING_DIRECTORY,
    {
      recursive: true,
      force: true,
    },
  );

  await ensureDirectory(
    STAGING_DIRECTORY,
  );

  console.log(
    "Copiando documentos processados...",
  );

  await copyDirectory(
    SOURCE_KNOWLEDGE,
    STAGING_DIRECTORY,
    {
      skipFiles: new Set([
        "_relatorio_ingestao.csv",
      ]),
    },
  );

  console.log(
    "Aplicando overrides manuais...",
  );

  await copyDirectory(
    SOURCE_OVERRIDES,
    STAGING_DIRECTORY,
  );

  console.log(
    "Copiando materiais da TecnoSpeed...",
  );

  await copyDirectory(
    SOURCE_TECNOSPEED,
    path.join(
      STAGING_DIRECTORY,
      "tecnospeed",
    ),
  );

  console.log(
    "Copiando planilhas...",
  );

  await copyDirectory(
    SOURCE_SPREADSHEETS,
    path.join(
      STAGING_DIRECTORY,
      "planilhas",
    ),
  );

  const fileCount =
    await countKnowledgeFiles(
      STAGING_DIRECTORY,
    );

  if (fileCount === 0) {
    throw new Error(
      "A sincronizacao nao encontrou arquivos de conhecimento.",
    );
  }

  console.log(
    `Arquivos preparados: ${fileCount}`,
  );

  console.log(
    "Substituindo a base antiga do Intelix...",
  );

  await rm(
    TARGET_DIRECTORY,
    {
      recursive: true,
      force: true,
    },
  );

  await rename(
    STAGING_DIRECTORY,
    TARGET_DIRECTORY,
  );

  console.log("");
  console.log(
    "Base sincronizada com sucesso.",
  );

  console.log(
    `Destino: ${TARGET_DIRECTORY}`,
  );

  console.log(
    `Total de arquivos: ${fileCount}`,
  );

  console.log("");
  console.log(
    "O indice antigo foi removido e devera ser gerado novamente.",
  );
}


main().catch((error) => {
  console.error("");
  console.error(
    "Erro ao sincronizar a base:",
  );

  console.error(error);

  process.exit(1);
});