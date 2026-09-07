import path from "node:path";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { safeRouteError } from "@/lib/api-error";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import { createUploadedKnowledgeDocument } from "@/services/knowledge-service";

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

// Vercel Functions rejeitam request bodies acima de 4,5 MB antes que a rota
// seja executada. Mantemos 15 MB nos demais ambientes e uma margem segura de
// 4 MB em deploys Vercel, sem aceitar uploads que a plataforma nao receberia.
const MAX_FILE_SIZE_MB = process.env.VERCEL === "1" ? 4 : 15;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const MIME_TYPES_BY_EXTENSION: Record<string, string[]> = {
  ".txt": ["text/plain"],
  ".md": ["text/markdown", "text/plain"],
  ".pdf": ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".csv": ["text/csv", "application/csv", "text/plain"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
};

function hasExpectedFileSignature(extension: string, buffer: Buffer) {
  if (extension === ".pdf") {
    return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  }

  // DOCX e XLSX sao pacotes ZIP. A extensao e o MIME tambem sao validados
  // antes do processamento; a verificacao evita aceitar binarios arbitrarios.
  if (extension === ".docx" || extension === ".xlsx") {
    return buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  }

  return true;
}

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
        { message: `O arquivo deve ter no maximo ${MAX_FILE_SIZE_MB} MB neste ambiente.` },
        { status: 400 },
      );
    }

    if (file.type && !MIME_TYPES_BY_EXTENSION[extension].includes(file.type)) {
      return NextResponse.json(
        { message: "O tipo MIME do arquivo nao corresponde ao formato informado." },
        { status: 400 },
      );
    }

    const safeFileName = sanitizeFileName(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    if (!hasExpectedFileSignature(extension, buffer)) {
      return NextResponse.json(
        { message: "O conteudo do arquivo nao corresponde ao formato informado." },
        { status: 400 },
      );
    }
    const result = await createUploadedKnowledgeDocument({
      fileName: safeFileName,
      mimeType: file.type || "application/octet-stream",
      fileSize: file.size,
      fileData: buffer,
      category: category as "NF_E" | "NFC_E" | "ESTOQUE" | "INVENTARIO" | "PCP" | "PROCEDIMENTOS",
      uploadedById: user.id,
    });

    const processingFailed = result.document.processingStatus === "ERROR";

    await createAuditLogSafely({
      user,
      action: "UPLOAD",
      entityType: "KNOWLEDGE_DOCUMENT",
      entityId: result.document.id,
      description: "Arquivo enviado para a base de conhecimento.",
      metadata: {
        fileName: safeFileName,
        category,
        size: file.size,
        processingStatus: result.document.processingStatus,
      },
    });

    if (processingFailed) {
      await createAuditLogSafely({
        user,
        action: "PROCESS",
        entityType: "KNOWLEDGE_DOCUMENT",
        entityId: result.document.id,
        description: "Falha ao processar arquivo enviado para a base de conhecimento.",
        metadata: {
          category,
          fileName: safeFileName,
        },
      });
    } else if (result.created) {
      await createAuditLogSafely({
        user,
        action: "PROCESS",
        entityType: "KNOWLEDGE_DOCUMENT",
        entityId: result.document.id,
        description: "Processamento do documento da base concluido.",
        metadata: {
          chunksIndexed: result.document.processingStatus === "READY",
        },
      });
    }

    return NextResponse.json(
      {
        message: processingFailed
          ? "Arquivo salvo, mas ocorreu uma falha no processamento."
          : result.created
            ? "Arquivo enviado e indexado com sucesso."
            : "Este arquivo ja esta disponivel na base de conhecimento.",
        document: result.document,
      },
      { status: result.created ? 201 : 200 },
    );
  } catch (error) {
    console.error("Falha ao enviar arquivo para a base.", error);

    return NextResponse.json(
      {
        message: safeRouteError(error, "Nao foi possivel enviar o arquivo."),
      },
      { status: 400 },
    );
  }
}
