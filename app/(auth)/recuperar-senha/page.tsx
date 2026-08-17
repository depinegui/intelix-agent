import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { RecoveryForm } from "@/components/auth/auth-forms";
import { getSessionUser } from "@/lib/session";

export default async function RecoveryPage() {
  const user = await getSessionUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      eyebrow="4. Recuperacao"
      title="Recupere o acesso e retorne ao atendimento com contexto preservado."
      description="Fluxo de redefinicao preparado para se integrar a servicos de notificacao e automacoes futuras sem alterar a estrutura central do projeto."
    >
      <RecoveryForm />
    </AuthShell>
  );
}
