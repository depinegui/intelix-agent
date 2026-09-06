import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
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

    const updatedUser = await updateOwnProfile(
      user.id,
      body,
    );

    await createAuditLogSafely({
      user,
      action: "UPDATE",
      entityType: "CHAT_MESSAGE",
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
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o perfil.",
      },
      { status: 400 },
    );
  }
}