import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-forms";
import { getSessionUser } from "@/lib/session";

export default async function RegisterPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="3. Cadastro"
      title="Estruture o acesso da equipe sem quebrar o fluxo operacional."
      description="Novo onboarding para areas de suporte, fiscal, estoque e PCP com arquitetura preparada para escalar o agente autonomo."
    >
      <RegisterForm />
    </AuthShell>
  );
}
