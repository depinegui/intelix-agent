import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";
import { getSessionUser } from "@/lib/session";

export default async function LoginPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="1. Landing / Login"
      title="Acesso seguro ao cockpit de suporte."
      description="Sessao autenticada com JWT, pronta para historico de atendimento, chamados e operacao assistida por IA."
    >
      <LoginForm />
    </AuthShell>
  );
}
