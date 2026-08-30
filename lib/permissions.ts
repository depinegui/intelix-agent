import type { SessionUser, UserRole } from "@/types";

export type Permission =
  | "VIEW_DASHBOARD"
  | "USE_CHAT"
  | "VIEW_TICKETS"
  | "CREATE_TICKET"
  | "MANAGE_TICKETS"
  | "VIEW_KNOWLEDGE"
  | "MANAGE_KNOWLEDGE"
  | "DELETE_KNOWLEDGE"
  | "VIEW_SETTINGS";

const allPermissions: Permission[] = [
  "VIEW_DASHBOARD",
  "USE_CHAT",
  "VIEW_TICKETS",
  "CREATE_TICKET",
  "MANAGE_TICKETS",
  "VIEW_KNOWLEDGE",
  "MANAGE_KNOWLEDGE",
  "DELETE_KNOWLEDGE",
  "VIEW_SETTINGS",
];

const permissionsByRole: Record<UserRole, Permission[]> = {
  ADMIN: allPermissions,
  ANALYST: [
    "VIEW_DASHBOARD",
    "USE_CHAT",
    "VIEW_TICKETS",
    "CREATE_TICKET",
    "MANAGE_TICKETS",
    "VIEW_KNOWLEDGE",
  ],
  SPECIALIST: [
    "VIEW_DASHBOARD",
    "USE_CHAT",
    "VIEW_TICKETS",
    "CREATE_TICKET",
    "MANAGE_TICKETS",
    "VIEW_KNOWLEDGE",
    "MANAGE_KNOWLEDGE",
  ],
};

export function getPermissionsForRole(role: UserRole): Permission[] {
  return [...permissionsByRole[role]];
}

export function hasPermission(
  subject: UserRole | Pick<SessionUser, "role">,
  permission: Permission,
) {
  const role = typeof subject === "string" ? subject : subject.role;
  return permissionsByRole[role].includes(permission);
}
