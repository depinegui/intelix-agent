import crypto from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { demoStore } from "@/database/demo-store";
import { prisma } from "@/lib/prisma";
import type {
  KnowledgeCategory,
  KnowledgeDocument,
  KnowledgeDocumentOrigin,
  KnowledgeInput,
  KnowledgeOverviewStats,
} from "@/types";
import { slugify } from "@/utils/format";

const knowledgeSchema = z.object({
  title: z.string().min(4),
  excerpt: z.string().min(12),
  content: z.string().min(24),
  category: z.enum(["NF_E", "NFC_E", "ESTOQUE", "INVENTARIO", "PCP", "PROCEDIMENTOS"]),
  tags: z.array(z.string()).min(1),
});

type KnowledgeRecord = {
  id: string; title: string; slug: string; excerpt: string; content: string;
  category: KnowledgeCategory; tags: string[]; views: number;
  origin: KnowledgeDocumentOrigin; processingStatus: KnowledgeDocument["processingStatus"];
  processingError: string | null; fileName: string | null; mimeType: string | null;
  fileSize: number | null; processedAt: Date | string | null;
  createdAt: Date | string; updatedAt: Date | string;
};

function serializeDate(value: Date | string | null) {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
}

function serializeKnowledge(record: KnowledgeRecord): KnowledgeDocument {
  return {
    id: record.id, title: record.title, slug: record.slug, excerpt: record.excerpt,
    content: record.content, category: record.category, tags: record.tags, views: record.views,
    origin: record.origin, processingStatus: record.processingStatus,
    processingError: record.processingError ?? undefined, fileName: record.fileName ?? undefined,
    mimeType: record.mimeType ?? undefined, fileSize: record.fileSize ?? undefined,
    processedAt: serializeDate(record.processedAt), createdAt: serializeDate(record.createdAt)!,
    updatedAt: serializeDate(record.updatedAt)!,
  };
}

async function processDocument(documentId: string) {
  const { processPersistentKnowledgeDocument } = await import("@/services/knowledge-rag-service");
  return processPersistentKnowledgeDocument(documentId);
}

async function processAndReadDocument(documentId: string) {
  try {
    await processDocument(documentId);
  } catch {
    // The processor persists ERROR and a safe diagnostic for the management UI.
  }
  return prisma?.knowledgeDocument.findUnique({ where: { id: documentId } });
}

export async function listKnowledgeDocuments(search?: string) {
  if (prisma) {
    const terms = search?.split(" ").map((term) => term.trim()).filter(Boolean) ?? [];
    const filters: Prisma.KnowledgeDocumentWhereInput[] = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
      { fileName: { contains: search, mode: "insensitive" } },
    ];
    if (terms.length > 0) filters.push({ tags: { hasSome: terms } });
    const documents = await prisma.knowledgeDocument.findMany({
      where: search ? { OR: filters } : undefined,
      orderBy: { updatedAt: "desc" },
    });
    return documents.map(serializeKnowledge);
  }

  const normalizedSearch = search?.toLowerCase().trim();
  const documents = normalizedSearch
    ? demoStore.knowledge.filter((document) =>
        `${document.title} ${document.excerpt} ${document.content} ${document.tags.join(" ")}`.toLowerCase().includes(normalizedSearch),
      )
    : demoStore.knowledge;
  return [...documents].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function createKnowledgeDocument(input: KnowledgeInput) {
  const data = knowledgeSchema.parse(input);
  const slug = `${slugify(data.title)}-${crypto.randomUUID().slice(0, 8)}`;
  if (prisma) {
    const document = await prisma.knowledgeDocument.create({
      data: { ...data, slug, origin: "MANUAL", processingStatus: "PENDING" },
    });
    return serializeKnowledge((await processAndReadDocument(document.id))!);
  }
  const now = new Date().toISOString();
  const document: KnowledgeDocument = {
    id: `doc_${crypto.randomUUID().slice(0, 8)}`, slug, views: 0, origin: "MANUAL",
    processingStatus: "READY", createdAt: now, updatedAt: now, ...data,
  };
  demoStore.knowledge.unshift(document);
  return document;
}

export async function updateKnowledgeDocument(id: string, input: KnowledgeInput) {
  const data = knowledgeSchema.parse(input);
  if (prisma) {
    const document = await prisma.knowledgeDocument.update({
      where: { id },
      data: { ...data, slug: `${slugify(data.title)}-${id.slice(-8)}`, processingStatus: "PENDING", processingError: null },
    });
    return serializeKnowledge((await processAndReadDocument(document.id))!);
  }
  const index = demoStore.knowledge.findIndex((document) => document.id === id);
  if (index < 0) throw new Error("Documento nao encontrado.");
  demoStore.knowledge[index] = { ...demoStore.knowledge[index], ...data, slug: slugify(data.title), updatedAt: new Date().toISOString() };
  return demoStore.knowledge[index];
}

export async function createUploadedKnowledgeDocument(input: {
  fileName: string; mimeType: string; fileSize: number; fileData: Buffer;
  category: KnowledgeCategory; uploadedById: string;
}) {
  if (!prisma) throw new Error("O upload persistente requer um banco de dados configurado.");
  const contentHash = crypto.createHash("sha256").update(input.fileData).digest("hex");
  const sourceKey = `upload:${contentHash}`;
  const existing = await prisma.knowledgeDocument.findUnique({ where: { sourceKey } });
  if (existing) return { document: serializeKnowledge(existing), created: false };
  const baseTitle = input.fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  const document = await prisma.knowledgeDocument.create({
    data: {
      title: baseTitle || "Documento enviado", slug: `${slugify(baseTitle || "documento-enviado")}-${contentHash.slice(0, 8)}`,
      excerpt: "Arquivo aguardando processamento para a base de conhecimento.", content: "", category: input.category,
      tags: [], origin: "UPLOAD", processingStatus: "PENDING", sourceKey, contentHash,
      fileName: input.fileName, mimeType: input.mimeType, fileSize: input.fileSize, fileData: input.fileData,
      uploadedById: input.uploadedById,
    },
  });
  return { document: serializeKnowledge((await processAndReadDocument(document.id))!), created: true };
}

export async function deleteKnowledgeDocument(id: string) {
  if (prisma) {
    const document = await prisma.knowledgeDocument.delete({ where: { id } });
    return { id: document.id, title: document.title, category: document.category, slug: document.slug };
  }
  const index = demoStore.knowledge.findIndex((document) => document.id === id);
  if (index < 0) throw new Error("Documento nao encontrado.");
  const [document] = demoStore.knowledge.splice(index, 1);
  return { id: document.id, title: document.title, category: document.category, slug: document.slug };
}

export async function searchKnowledgeDocuments(query: string, limit = 3) {
  const documents = await listKnowledgeDocuments(query);
  return documents.filter((document) => document.processingStatus === "READY").slice(0, limit);
}

export async function getKnowledgeOverview(search?: string) {
  const documents = await listKnowledgeDocuments(search);
  const stats: KnowledgeOverviewStats = { ragAccuracy: "Nao medido", averageResponse: "Nao medido" };
  return { documents, stats };
}
