import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import {
  setUserActiveByAdmin,
  updateUserByAdmin,
} from "@/services/auth-service";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(
  request: Request,
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
    const body = await request.json();

    if (typeof body.isActive === "boolean") {
      const updatedUser = await setUserActiveByAdmin(
        id,
        user.id,
        body.isActive,
      );

      await createAuditLogSafely({
        user,
        action: "STATUS_CHANGE",
        entityType: "USER",
        entityId: updatedUser.id,
        description: updatedUser.isActive
          ? "Usuario reativado pelo administrador."
          : "Usuario desativado pelo administrador.",
        metadata: {
          targetUserId: updatedUser.id,
          targetUserName: updatedUser.name,
          targetUserEmail: updatedUser.email,
          targetUserRole: updatedUser.role,
          isActive: updatedUser.isActive,
        },
      });

      return NextResponse.json({ user: updatedUser });
    }

    const updateResult = await updateUserByAdmin(
      id,
      user.id,
      body,
    );
    const updatedUser = updateResult.user;

    await createAuditLogSafely({
      user,
      action: "UPDATE",
      entityType: "USER",
      entityId: updatedUser.id,
      description: "Usuario atualizado pelo administrador.",
      metadata: {
        updatedUserId: updatedUser.id,
        updatedUserName: updatedUser.name,
        updatedUserEmail: updatedUser.email,
        updatedUserRole: updatedUser.role,
      },
    });

    if (updateResult.previousRole !== updatedUser.role) {
      await createAuditLogSafely({
        user,
        action: "UPDATE",
        entityType: "USER",
        entityId: updatedUser.id,
        description: "Perfil de acesso do usuario alterado pelo administrador.",
        metadata: {
          targetUserId: updatedUser.id,
          previousRole: updateResult.previousRole,
          newRole: updatedUser.role,
        },
      });
    }

    return NextResponse.json({
      user: updatedUser,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel atualizar o usuario.",
      },
      { status: 400 },
    );
  }
}
