import { AppShell } from "@/components/layout/app-shell";
import { ProductEvaluationGate } from "@/components/evaluation/product-evaluation-gate";
import { isDatabaseEnabled } from "@/lib/env";
import { getPermissionsForRole } from "@/lib/permissions";
import { requireSessionUser } from "@/lib/session";

export default async function WorkspaceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireSessionUser();

  return (
    <>
      <ProductEvaluationGate />
      <AppShell
        user={user}
        mode={isDatabaseEnabled ? "database" : "demo"}
        permissions={getPermissionsForRole(user.role)}
      >
        {children}
      </AppShell>
    </>
  );
}
