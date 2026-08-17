import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionCookieOptions,
} from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { registerUser } from "@/services/auth-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerUser(body);
    const token = await createSessionToken(user);

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(AUTH_COOKIE_NAME, token, getSessionCookieOptions());
    return response;
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Nao foi possivel criar a conta.",
      },
      { status: 400 },
    );
  }
}
