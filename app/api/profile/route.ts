import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { safeRouteError } from "@/lib/api-error";
import { createAuditLogSafely } from "@/services/audit-service";
import { updateOwnProfile } from "@/services/auth-service";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { message: "Nao autorizado." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    user,
  });
}

export async function PATCH(request: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { message: "Nao autorizado." },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    if ("role" in body) {
      return NextResponse.json(
        { message: "O perfil de acesso nao pode ser alterado pelo proprio usuario." },
        { status: 403 },
      );
    }

    const updatedUser = await updateOwnProfile(
      user.id,
      body,
    );

    await createAuditLogSafely({
      user,
      action: "UPDATE",
      entityType: "USER",
      entityId: updatedUser.id,
      description: "Perfil atualizado pelo proprio usuario.",
      metadata: {
        updatedUserId: updatedUser.id,
        updatedUserName: updatedUser.name,
        updatedUserEmail: updatedUser.email,
        updatedUserRole: updatedUser.role,
      },
    });

    return NextResponse.json({
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: safeRouteError(error, "Nao foi possivel atualizar o perfil."),
      },
      { status: 400 },
    );
  }
}
