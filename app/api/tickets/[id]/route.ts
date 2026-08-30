import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { updateTicketStatus } from "@/services/ticket-service";

const updateSchema = z.object({
  status: z.enum([
    "ABERTO",
    "EM_TRIAGEM",
    "EM_ANDAMENTO",
    "IA_RESOLVIDO",
    "ESCALADO",
    "FECHADO",
  ]),
  note: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "MANAGE_TICKETS")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = updateSchema.parse(body);
    const { id } = await params;
    const ticket = await updateTicketStatus(id, data.status, user.name, data.note);
    return NextResponse.json({ ticket });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o chamado.",
      },
      { status: 400 },
    );
  }
}
