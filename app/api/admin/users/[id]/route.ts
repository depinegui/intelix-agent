import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import { deleteUserByAdmin } from "@/services/auth-service";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { message: "Nao autorizado." },
      { status: 401 },
    );
  }

  if (!hasPermission(user, "MANAGE_USERS")) {
    return NextResponse.json(
      { message: "Acesso negado." },
      { status: 403 },
    );
  }

  try {
    const { id } = await context.params;

    const deletedUser = await deleteUserByAdmin(
      id,
      user.id,
    );

    await createAuditLogSafely({
      user,
      action: "DELETE",
      entityType: "CHAT_MESSAGE",
      entityId: deletedUser.id,
      description: "Usuario removido pelo administrador.",
      metadata: {
        deletedUserId: deletedUser.id,
        deletedUserName: deletedUser.name,
        deletedUserEmail: deletedUser.email,
        deletedUserRole: deletedUser.role,
      },
    });

    return NextResponse.json({
      message: "Usuario removido com sucesso.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel remover o usuario.",
      },
      { status: 400 },
    );
  }
}