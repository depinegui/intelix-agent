import { BrainCircuit, Database, KeyRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { env, isDatabaseEnabled, isOpenAiEnabled } from "@/lib/env";

export default function SettingsPage() {
  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="rounded-[30px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Database className="size-6 text-primary" />
            Banco de dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 text-sm leading-7 text-muted-foreground">
          <p>Status: {isDatabaseEnabled ? "Configurado" : "Modo demo ativo"}</p>
          <p>Provider esperado: PostgreSQL</p>
          <p>
            {isDatabaseEnabled
              ? "O projeto vai usar Prisma + PostgreSQL para persistencia real."
              : "Sem DATABASE_URL o sistema continua funcional em memoria para demonstracao."}
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-[30px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <BrainCircuit className="size-6 text-primary" />
            OpenAI e agentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 text-sm leading-7 text-muted-foreground">
          <p>Status do SDK: {isOpenAiEnabled ? "Chave configurada" : "Fallback local"}</p>
          <p>Modelo padrao: {env.openAiModel}</p>
          <p>
            Mesmo sem chave, o chat continua funcional usando contexto local da
            base de conhecimento e historico de chamados.
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-[30px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <KeyRound className="size-6 text-primary" />
            Sessao e seguranca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-6 pb-6 text-sm leading-7 text-muted-foreground">
          <p>Autenticacao: JWT via cookie HTTP-only</p>
          <p>Escopo atual: login, cadastro, recuperacao e logout</p>
          <p>
            O middleware protege rotas autenticadas e a verificacao completa da
            sessao acontece no servidor.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
