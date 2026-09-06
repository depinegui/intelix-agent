import path from "node:path";
import { mkdir, writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import { indexKnowledgeBase } from "@/services/knowledge-rag-service";

export const runtime = "nodejs";

const SUPPORTED_EXTENSIONS = new Set([
  ".txt",
  ".md",
  ".pdf",
  ".docx",
  ".csv",
  ".xlsx",
]);

const KNOWLEDGE_CATEGORIES = new Set([
  "NF_E",
  "NFC_E",
  "ESTOQUE",
  "INVENTARIO",
  "PCP",
  "PROCEDIMENTOS",
]);

const MAX_FILE_SIZE = 15 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  const extension = path.extname(fileName).toLowerCase();
  const baseName = path.basename(fileName, extension);

  const safeBaseName = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return `${safeBaseName || "documento"}${extension}`;
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { message: "Nao autorizado." },
      { status: 401 },
    );
  }

  if (!hasPermission(user, "MANAGE_KNOWLEDGE")) {
    return NextResponse.json(
      { message: "Acesso negado." },
      { status: 403 },
    );
  }

  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const category = String(formData.get("category") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { message: "Selecione um arquivo para enviar." },
        { status: 400 },
      );
    }

    if (!KNOWLEDGE_CATEGORIES.has(category)) {
      return NextResponse.json(
        { message: "Categoria invalida." },
        { status: 400 },
      );
    }

    const extension = path.extname(file.name).toLowerCase();

    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        {
          message:
            "Formato nao suportado. Utilize TXT, MD, PDF, DOCX, CSV ou XLSX.",
        },
        { status: 400 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { message: "O arquivo enviado esta vazio." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: "O arquivo deve ter no maximo 15 MB." },
        { status: 400 },
      );
    }

    const safeFileName = sanitizeFileName(file.name);

    const uploadDirectory = path.join(
      process.cwd(),
      "knowledge",
      "uploads",
      category.toLowerCase(),
    );

    await mkdir(uploadDirectory, { recursive: true });

    const storedFileName = `${Date.now()}-${safeFileName}`;
    const filePath = path.join(uploadDirectory, storedFileName);

    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filePath, buffer);

    const indexingResult = await indexKnowledgeBase();

    await createAuditLogSafely({
      user,
      action: "CREATE",
      entityType: "KNOWLEDGE_DOCUMENT",
      description: "Arquivo enviado para a base de conhecimento.",
      metadata: {
        event: "KNOWLEDGE_UPLOAD",
        originalFileName: file.name,
        storedFileName,
        category,
        size: file.size,
      },
    });

    return NextResponse.json(
      {
        message: "Arquivo enviado e base reindexada com sucesso.",
        file: {
          name: file.name,
          storedFileName,
          category,
          size: file.size,
        },
        indexing: indexingResult,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Falha ao enviar arquivo para a base.", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel enviar o arquivo.",
      },
      { status: 400 },
    );
  }
}