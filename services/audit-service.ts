import {
  Prisma,
  type AuditAction,
  type AuditEntityType,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/types";

type AuditMetadata = Record<string, string | number | boolean | null>;

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
