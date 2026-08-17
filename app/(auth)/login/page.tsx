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
      eyebrow="Acesso ao sistema"
      title="Entre no Intelix para continuar."
      description="Acesse o ambiente do agente para utilizar o chat, consultar informações e acompanhar os recursos disponíveis para o seu usuário."
    >
      <LoginForm />
    </AuthShell>
  );
}
