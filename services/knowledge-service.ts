import { Prisma } from "@prisma/client";
import { z } from "zod";
import {
  demoStore,
  knowledgeHighlights,
  prototypeDashboard,
} from "@/database/demo-store";
import { prisma } from "@/lib/prisma";
import type { KnowledgeDocument, KnowledgeInput } from "@/types";
import { slugify } from "@/utils/format";

const knowledgeSchema = z.object({
  title: z.string().min(4),
  excerpt: z.string().min(12),
  content: z.string().min(24),
  category: z.enum([
    "NF_E",
    "NFC_E",
    "ESTOQUE",
    "INVENTARIO",
    "PCP",
    "PROCEDIMENTOS",
  ]),
  tags: z.array(z.string()).min(1),
});

function serializeKnowledge(record: {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: KnowledgeDocument["category"];
  tags: string[];
  views: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}): KnowledgeDocument {
  return {
    ...record,
    createdAt:
      record.createdAt instanceof Date
        ? record.createdAt.toISOString()
        : record.createdAt,
    updatedAt:
      record.updatedAt instanceof Date
        ? record.updatedAt.toISOString()
        : record.updatedAt,
  };
}

export async function listKnowledgeDocuments(search?: string) {
  if (prisma) {
    const terms =
      search
        ?.split(" ")
        .map((term) => term.trim())
        .filter(Boolean) ?? [];
    const filters: Prisma.KnowledgeDocumentWhereInput[] = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];

    if (terms.length > 0) {
      filters.push({ tags: { hasSome: terms } });
    }

    const documents = await prisma.knowledgeDocument.findMany({
      where: search
        ? {
            OR: filters,
          }
        : undefined,
      orderBy: { updatedAt: "desc" },
    });

    return documents.map(serializeKnowledge);
  }

  const normalizedSearch = search?.toLowerCase().trim();
  const documents = normalizedSearch
    ? demoStore.knowledge.filter((document) => {
        const haystack = `${document.title} ${document.excerpt} ${document.content} ${document.tags.join(" ")}`.toLowerCase();
        return haystack.includes(normalizedSearch);
      })
    : demoStore.knowledge;

  return [...documents].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
}

export async function createKnowledgeDocument(input: KnowledgeInput) {
  const data = knowledgeSchema.parse(input);
  const slug = slugify(data.title);

  if (prisma) {
    const document = await prisma.knowledgeDocument.create({
      data: {
        ...data,
        slug,
      },
    });

    return serializeKnowledge(document);
  }

  const now = new Date().toISOString();
  const document: KnowledgeDocument = {
    id: `doc_${crypto.randomUUID().slice(0, 8)}`,
    slug,
    views: 0,
    createdAt: now,
    updatedAt: now,
    ...data,
  };

  demoStore.knowledge.unshift(document);
  return document;
}

export async function updateKnowledgeDocument(id: string, input: KnowledgeInput) {
  const data = knowledgeSchema.parse(input);

  if (prisma) {
    const document = await prisma.knowledgeDocument.update({
      where: { id },
      data: {
        ...data,
        slug: slugify(data.title),
      },
    });

    return serializeKnowledge(document);
  }

  const index = demoStore.knowledge.findIndex((document) => document.id === id);

  if (index < 0) {
    throw new Error("Documento nao encontrado.");
  }

  demoStore.knowledge[index] = {
    ...demoStore.knowledge[index],
    ...data,
    slug: slugify(data.title),
    updatedAt: new Date().toISOString(),
  };

  return demoStore.knowledge[index];
}

export async function deleteKnowledgeDocument(id: string) {
  if (prisma) {
    await prisma.knowledgeDocument.delete({
      where: { id },
    });
    return;
  }

  const index = demoStore.knowledge.findIndex((document) => document.id === id);

  if (index < 0) {
    throw new Error("Documento nao encontrado.");
  }

  demoStore.knowledge.splice(index, 1);
}

export async function searchKnowledgeDocuments(query: string, limit = 3) {
  const documents = await listKnowledgeDocuments(query);
  return documents.slice(0, limit);
}

export async function getKnowledgeOverview(search?: string) {
  const documents = await listKnowledgeDocuments(search);

  return {
    documents,
    highlights: knowledgeHighlights,
    stats: {
      indexedDocs: prototypeDashboard.indexedDocs,
      ragAccuracy: prototypeDashboard.ragAccuracy,
      averageResponse: "<2s",
    },
  };
}
