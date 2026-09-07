import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { safeRouteError } from "@/lib/api-error";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import { escalateChatMessageToTicket } from "@/services/chat-service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  if (!hasPermission(user, "CREATE_TICKET")) return NextResponse.json({ message: "Acesso negado." }, { status: 403 });

  try {
    const { id } = await params;
    const result = await escalateChatMessageToTicket(user, id);
    if (result.created) {
      await createAuditLogSafely({
        user,
        action: "ESCALATE",
        entityType: "TICKET",
        entityId: result.ticket.id,
        description: "Chamado escalado pelo Intelix Agent para atendimento humano.",
        metadata: { protocol: result.ticket.protocol, category: result.ticket.category },
      });
    }
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    return NextResponse.json({ message: safeRouteError(error, "Nao foi possivel encaminhar para atendimento.") }, { status: 400 });
  }
}
