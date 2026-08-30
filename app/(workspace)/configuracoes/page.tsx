import { BrainCircuit, Database, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseEnabled, isOpenAiEnabled } from "@/lib/env";
import { requirePermission } from "@/lib/session";

export default async function SettingsPage() {
  await requirePermission("VIEW_SETTINGS");
  return (
    <div className="grid gap-3 xl:grid-cols-3">
      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/70 px-5 py-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <Database className="size-5 text-primary" />
            Dados e disponibilidade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5 py-5 text-sm leading-6 text-muted-foreground">
          <p>Status: {isDatabaseEnabled ? "Conexao ativa" : "Ambiente de demonstracao"}</p>
          <p>
            {isDatabaseEnabled
              ? "As informações do ambiente estão disponíveis para o trabalho diário."
              : "Este ambiente está preparado para demonstração e treinamento."}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/70 px-5 py-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <BrainCircuit className="size-5 text-primary" />
            Assistente inteligente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5 py-5 text-sm leading-6 text-muted-foreground">
          <p>Status: {isOpenAiEnabled ? "Disponivel" : "Base de conhecimento disponivel"}</p>
          <p>
            O atendimento utiliza informações disponíveis para orientar as respostas.
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/80 shadow-sm">
        <CardHeader className="border-b border-border/70 px-5 py-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <KeyRound className="size-5 text-primary" />
            Acesso e seguranca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-5 py-5 text-sm leading-6 text-muted-foreground">
          <p>Acesso protegido por sessão autenticada.</p>
          <p>Perfis de acesso aplicados às áreas do ambiente.</p>
          <p>
            As permissões são verificadas antes de cada operação disponível.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
