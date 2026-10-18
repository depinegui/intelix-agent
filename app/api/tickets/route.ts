import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { safeRouteError } from "@/lib/api-error";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import { createTicket, listTickets } from "@/services/ticket-service";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "VIEW_TICKETS")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const tickets = await listTickets({
    requesterId: user.role === "ADMIN" ? undefined : user.id,
  });
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "CREATE_TICKET")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const ticket = await createTicket(body, user);
    await createAuditLogSafely({
      user,
      action: "CREATE",
      entityType: "TICKET",
      entityId: ticket.id,
      description: "Chamado criado.",
      metadata: {
        protocol: ticket.protocol,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
      },
    });
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message: safeRouteError(error, "Nao foi possivel abrir o chamado."),
      },
      { status: 400 },
    );
  }
}
