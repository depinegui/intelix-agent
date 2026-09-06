import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createAuditLogSafely } from "@/services/audit-service";
import { changeOwnPassword } from "@/services/auth-service";

export async function POST(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { message: "Nao autorizado." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    await changeOwnPassword(user.id, body);

    await createAuditLogSafely({
      user,
      action: "UPDATE",
      entityType: "USER",
      entityId: user.id,
      description: "Senha alterada pelo proprio usuario.",
      metadata: {
        event: "PASSWORD_CHANGE",
      },
    });

    return NextResponse.json({
      message: "Senha atualizada com sucesso.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar a senha.",
      },
      { status: 400 },
    );
  }
}
