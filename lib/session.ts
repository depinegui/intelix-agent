import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/lib/auth";
import { AUTH_COOKIE_NAME } from "@/lib/constants";
import { hasPermission, type Permission } from "@/lib/permissions";
import { getUserById } from "@/services/auth-service";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);

  if (!payload?.sub) {
    return null;
  }

  return getUserById(payload.sub);
}

export async function requireSessionUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireSessionUser();

  if (!hasPermission(user, permission)) {
    redirect("/dashboard");
  }

  return user;
}
