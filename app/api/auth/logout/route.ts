import { NextResponse } from "next/server";
import { getSessionCookieOptions } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  return response;
}
