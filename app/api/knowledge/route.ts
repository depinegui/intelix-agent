import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import {
  createKnowledgeDocument,
  listKnowledgeDocuments,
} from "@/services/knowledge-service";

export async function GET(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "VIEW_KNOWLEDGE")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const documents = await listKnowledgeDocuments(searchParams.get("q") ?? "");

  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({ message: "Nao autorizado." }, { status: 401 });
  }

  if (!hasPermission(user, "MANAGE_KNOWLEDGE")) {
    return NextResponse.json({ message: "Acesso negado." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const document = await createKnowledgeDocument(body);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel criar o documento.",
      },
      { status: 400 },
    );
  }
}
