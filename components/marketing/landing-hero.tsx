import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  DatabaseZap,
  Gauge,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const capabilities = [
  "IA Avancada",
  "Agentes Autonomos",
  "RAG Context",
  "Resposta Rapida",
];

const quickStats = [
  { label: "Precisao RAG", value: "98.7%" },
  { label: "Tempo medio", value: "< 2s" },
  { label: "Chamados tratados", value: "127" },
];

export function LandingHero() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1560px] gap-6 lg:grid-cols-[1.18fr_0.82fr]">
        <section className="hero-shell grid-overlay relative overflow-hidden rounded-[36px] px-6 py-8 text-white shadow-[0_26px_80px_rgba(10,19,32,0.28)] md:px-10 md:py-10 lg:px-14 lg:py-12">
          <div className="relative z-10 flex h-full flex-col">
            <div className="flex items-center justify-between gap-4">
              <BrandMark inverted />
              <div className="hidden rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/72 md:block">
                Agente autonomo de IA para suporte tecnico empresarial
              </div>
            </div>

            <div className="mt-12 max-w-3xl space-y-8">
              <div className="flex flex-wrap gap-3">
                {capabilities.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/12 bg-white/8 px-4 py-2 text-sm text-white/78"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="space-y-4">
                <p className="max-w-xl text-sm leading-7 text-white/74 md:text-base">
                  Sistema moderno de suporte tecnico para ERP, preparado para
                  atendimento orientado por contexto, memoria conversacional e
                  orquestracao multiagente.
                </p>
                <h1 className="max-w-3xl text-4xl leading-tight font-semibold md:text-5xl lg:text-[66px] lg:leading-[1.02]">
                  O cockpit de suporte que une atendimento humano, RAG e IA
                  operacional.
                </h1>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[28px] border border-white/10 bg-white/7 p-5">
                  <BrainCircuit className="mb-4 size-7 text-cyan-200" />
                  <p className="text-base font-semibold">Triagem inteligente</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Classificacao automatica de chamados e sugestao imediata de
                    resolucao.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/7 p-5">
                  <DatabaseZap className="mb-4 size-7 text-cyan-200" />
                  <p className="text-base font-semibold">Base viva</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Conhecimento indexado para consultas de ERP, rejeicoes
                    fiscais e procedimentos internos.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/7 p-5">
                  <Gauge className="mb-4 size-7 text-cyan-200" />
                  <p className="text-base font-semibold">Operacao escalavel</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Historico unificado, prioridade de fila e pronto para novas
                    integracoes.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-4 pt-10 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "h-12 rounded-2xl px-6",
                  )}
                >
                  Acessar Plataforma
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/cadastro"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "h-12 rounded-2xl border-white/20 bg-white/8 px-6 text-white hover:bg-white/12",
                  )}
                >
                  Solicitar acesso
                </Link>
              </div>
              <div className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/74">
                Fluxo pronto para OpenAI SDK, LangChain e vector database
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card flex flex-col justify-between p-6 md:p-8">
          <div>
            <div className="flex items-center justify-between gap-3">
              <BrandMark compact />
              <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                Demo pronta
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <p className="text-sm font-semibold tracking-[0.24em] text-primary/80 uppercase">
                Inteligencia aplicada ao suporte
              </p>
              <h2 className="text-3xl leading-tight font-semibold text-foreground md:text-[40px]">
                Atendimento mais rapido, documentado e preparado para escalar.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                A estrutura fullstack foi organizada para autenticao, historico
                de conversas, CRUD de chamados, base de conhecimento e futura
                expansao com agentes especializados.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-border/70 bg-muted/55 p-4"
                >
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="teal-outline rounded-[30px] border border-primary/14 bg-card p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-primary/12 p-3 text-primary">
                  <Sparkles className="size-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Credenciais de teste
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    analista@intelix.ai
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-[22px] bg-muted/55 p-4 font-mono text-sm text-muted-foreground">
                Senha: Intelix@2026
              </div>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                O projeto sobe em modo demo mesmo sem banco configurado, mas
                toda a camada Prisma/PostgreSQL ja esta pronta para producao.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
