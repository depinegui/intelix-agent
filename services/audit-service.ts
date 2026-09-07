import {
  Prisma,
  type AuditAction,
  type AuditEntityType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

type AuditMetadata = Record<string, string | number | boolean | null>;

export const auditActions = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "STATUS_CHANGE",
  "FEEDBACK",
  "LOGIN",
  "UPLOAD",
  "PROCESS",
  "ESCALATE",
] as const satisfies readonly AuditAction[];

export const auditEntityTypes = [
  "USER",
  "KNOWLEDGE_DOCUMENT",
  "TICKET",
  "CHAT_MESSAGE",
] as const satisfies readonly AuditEntityType[];

interface CreateAuditLogInput {
  user: Pick<SessionUser, "id" | "name">;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string;
  description: string;
  metadata?: AuditMetadata;
}

export async function createAuditLog({
  user,
  action,
  entityType,
  entityId,
  description,
  metadata,
}: CreateAuditLogInput) {
  if (!prisma) {
    return;
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      userName: user.name,
      action,
      entityType,
      entityId,
      description,
      metadata: metadata as Prisma.InputJsonObject | undefined,
    },
  });
}

export async function createAuditLogSafely(input: CreateAuditLogInput) {
  try {
    await createAuditLog(input);
  } catch (error) {
    // A auditoria e complementar: uma falha aqui nao deve desfazer uma
    // alteracao ja concluida. O erro permanece observavel no servidor.
    console.error("Falha ao registrar auditoria.", error);
  }
}

function sanitizeAuditMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return null;
  }

  const sensitiveKey = /password|secret|token|hash|path|content|filedata/i;
  const visibleEntries = Object.entries(metadata).flatMap(([key, value]) => {
    if (sensitiveKey.test(key) || !["string", "number", "boolean"].includes(typeof value)) {
      return [];
    }

    const safeValue = typeof value === "string" ? value.slice(0, 240) : value;
    return [[key, safeValue] as const];
  });

  return visibleEntries.length > 0 ? Object.fromEntries(visibleEntries) : null;
}

export async function listAuditLogs(input: {
  page: number;
  pageSize: number;
  user?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  query?: string;
  from?: Date;
  to?: Date;
}) {
  if (!prisma) {
    return { logs: [], total: 0, users: [] };
  }

  const where: Prisma.AuditLogWhereInput = {
    ...(input.user
      ? { userId: input.user }
      : undefined),
    ...(input.action ? { action: input.action } : undefined),
    ...(input.entityType ? { entityType: input.entityType } : undefined),
    ...(input.from || input.to
      ? { createdAt: { ...(input.from ? { gte: input.from } : {}), ...(input.to ? { lte: input.to } : {}) } }
      : undefined),
    ...(input.query
      ? {
          OR: [
            { description: { contains: input.query, mode: "insensitive" } },
            { userName: { contains: input.query, mode: "insensitive" } },
            { entityId: { contains: input.query, mode: "insensitive" } },
          ],
        }
      : undefined),
  };

  const [records, total, users] = await prisma.$transaction([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where: { userId: { not: null }, userName: { not: null } },
      distinct: ["userId"],
      select: { userId: true, userName: true },
      orderBy: { userName: "asc" },
    }),
  ]);

  return {
    total,
    users: users.flatMap((user) =>
      user.userId && user.userName ? [{ id: user.userId, name: user.userName }] : [],
    ),
    logs: records.map((record) => ({
      id: record.id,
      userId: record.userId,
      userName: record.userName,
      action: record.action,
      entityType: record.entityType,
      entityId: record.entityId,
      description: record.description,
      metadata: sanitizeAuditMetadata(record.metadata),
      createdAt: record.createdAt.toISOString(),
    })),
  };
}
