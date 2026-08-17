import { type JWTPayload, SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";
import type { SessionUser } from "@/types";

const secret = new TextEncoder().encode(env.jwtSecret);

export interface SessionTokenPayload extends JWTPayload {
  email: string;
  name: string;
  role: SessionUser["role"];
  companyType: SessionUser["companyType"];
  document: string;
  phone: string;
}

export async function createSessionToken(user: SessionUser) {
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
    companyType: user.companyType,
    document: user.document,
    phone: user.phone,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify<SessionTokenPayload>(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  };
}
