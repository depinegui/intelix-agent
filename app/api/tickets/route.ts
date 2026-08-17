import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createTicket, listTickets } from "@/services/ticket-service";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  const tickets = await listTickets();
  return NextResponse.json({ tickets });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const ticket = await createTicket(body, user);
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel abrir o chamado.",
      },
      { status: 400 },
    );
  }
}
