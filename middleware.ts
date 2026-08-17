import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "@/lib/constants";

const protectedPrefixes = [
  "/dashboard",
  "/chat-ia",
  "/chamados",
  "/base-conhecimento",
  "/configuracoes",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requiresAuth = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix),
  );

  if (!requiresAuth) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/chat-ia/:path*",
    "/chamados/:path*",
    "/base-conhecimento/:path*",
    "/configuracoes/:path*",
  ],
};
