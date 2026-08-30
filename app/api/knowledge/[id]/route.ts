import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import {
  deleteKnowledgeDocument,
  updateKnowledgeDocument,
} from "@/services/knowledge-service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "MANAGE_KNOWLEDGE")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = await params;
    const document = await updateKnowledgeDocument(id, body);
    await createAuditLogSafely({
      user,
      action: "UPDATE",
      entityType: "KNOWLEDGE_DOCUMENT",
      entityId: document.id,
      description: "Documento da base atualizado.",
      metadata: {
        title: document.title,
        category: document.category,
        slug: document.slug,
      },
    });
    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o documento.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "DELETE_KNOWLEDGE")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const document = await deleteKnowledgeDocument(id);
    await createAuditLogSafely({
      user,
      action: "DELETE",
      entityType: "KNOWLEDGE_DOCUMENT",
      entityId: document.id,
      description: "Documento da base excluido.",
      metadata: {
        title: document.title,
        category: document.category,
        slug: document.slug,
      },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel remover o documento.",
      },
      { status: 400 },
    );
  }
}
