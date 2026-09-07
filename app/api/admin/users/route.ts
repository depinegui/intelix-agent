import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { safeRouteError } from "@/lib/api-error";
import { hasPermission } from "@/lib/permissions";
import { createAuditLogSafely } from "@/services/audit-service";
import {
  createUserByAdmin,
  listUsers,
} from "@/services/auth-service";

export async function GET() {
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

  const users = await listUsers();

  return NextResponse.json({ users });
}

export async function POST(request: Request) {
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
    const body = await request.json();
    const createdUser = await createUserByAdmin(body);

    await createAuditLogSafely({
      user,
      action: "CREATE",
      entityType: "USER",
      entityId: createdUser.id,
      description: "Usuario criado pelo administrador.",
      metadata: {
        createdUserId: createdUser.id,
        createdUserName: createdUser.name,
        createdUserEmail: createdUser.email,
        createdUserRole: createdUser.role,
      },
    });

    return NextResponse.json(
      { user: createdUser },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: safeRouteError(error, "Nao foi possivel criar o usuario."),
      },
      { status: 400 },
    );
  }
}
