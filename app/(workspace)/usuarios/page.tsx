import { requirePermission } from "@/lib/session";
import { UsersView } from "@/components/users/users-view";

export default async function UsersPage() {
  await requirePermission("MANAGE_USERS");

  return <UsersView />;
}