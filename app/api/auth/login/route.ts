import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
} from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { createAuditLogSafely } from "@/services/audit-service";
import { loginUser } from "@/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await loginUser(body);
    const token = await createSessionToken(user);

    await createAuditLogSafely({
      user,
      action: "UPDATE",
      entityType: "USER",
      entityId: user.id,
      description: "Login realizado no Intelix.",
      metadata: {
        event: "LOGIN",
        role: user.role,
      },
    });

    const response = NextResponse.json({ user });

    response.cookies.set(
      AUTH_COOKIE_NAME,
      token,
      getSessionCookieOptions(),
    );

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel fazer login.",
      },
      { status: 400 },
    );
  }
}
