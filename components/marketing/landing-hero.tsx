import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  DatabaseZap,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: DatabaseZap,
    title: "Conhecimento recuperado",
    description: "Consulta informações relevantes na base indexada antes de responder.",
  },
  {
    icon: BrainCircuit,
    title: "Contexto para a IA",
    description: "Os trechos recuperados são utilizados como contexto pelo modelo de linguagem.",
  },
  {
    icon: MessageSquareText,
    title: "Conversa natural",
    description: "O usuário interage com o agente utilizando perguntas em linguagem natural.",
  },
];

export function LandingHero() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(21,184,205,0.12),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(21,184,205,0.08),transparent_30%)] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto min-h-[calc(100vh-2rem)] max-w-[1500px] overflow-hidden rounded-[36px] border border-border/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.12)] md:min-h-[calc(100vh-3rem)]">
        <header className="flex items-center justify-between border-b border-border/60 px-6 py-5 md:px-10 lg:px-14">
          <BrandMark compact />
          <div className="hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium text-muted-foreground sm:flex">
            <span className="size-2 rounded-full bg-primary" />
            Inteligência Artificial aplicada ao suporte técnico
          </div>
        </header>

        <div className="grid min-h-[calc(100vh-8rem)] lg:grid-cols-[1.08fr_0.92fr]">
          <section className="relative flex flex-col justify-between overflow-hidden bg-[#0e1b2d] px-7 py-10 text-white md:px-10 lg:px-14 lg:py-14">
            <div className="pointer-events-none absolute -left-24 top-20 size-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative z-10 max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-100">
                <Sparkles className="size-4" />
                Intelix Agent
              </div>

              <p className="text-sm font-semibold tracking-[0.25em] text-cyan-300 uppercase">
                IA + RAG + conhecimento especializado
              </p>
              <h1 className="mt-5 max-w-3xl text-4xl leading-[1.05] font-semibold tracking-[-0.035em] md:text-6xl lg:text-[68px]">
                Suporte técnico com contexto, conhecimento e Inteligência Artificial.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                O Intelix auxilia usuários na resolução de dúvidas operacionais em sistemas de gestão empresarial, recuperando informações da base de conhecimento antes de gerar cada resposta.
              </p>

              <div className="mt-9 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Retrieval-Augmented Generation</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Base de conhecimento</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">Linguagem natural</span>
              </div>
            </div>

            <div className="relative z-10 mt-12 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-13 rounded-2xl px-7 text-base shadow-[0_10px_30px_rgba(6,182,212,0.2)]",
                )}
              >
                Acessar o Intelix
                <ArrowRight className="size-4" />
              </Link>
              <p className="max-w-sm text-sm leading-6 text-slate-400 sm:text-right">
                Agente de IA desenvolvido para suporte técnico em sistemas ERP.
              </p>
            </div>
          </section>

          <section className="flex flex-col justify-center bg-white px-7 py-10 md:px-10 lg:px-12 lg:py-14">
            <div className="mx-auto w-full max-w-xl">
              <p className="text-sm font-semibold tracking-[0.22em] text-primary uppercase">
                Como o Intelix trabalha
              </p>
              <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-[-0.025em] text-foreground md:text-4xl">
                A resposta começa pela busca do contexto certo.
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Em vez de depender somente do conhecimento do modelo de linguagem, o Intelix utiliza RAG para recuperar conteúdo relevante da base indexada e apoiar a resposta apresentada ao usuário.
              </p>

              <div className="mt-9 space-y-3">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.title}
                      className="group flex gap-4 rounded-[24px] border border-border/70 bg-muted/35 p-5 transition-colors hover:bg-muted/55"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold tracking-[0.16em] text-primary/70">0{index + 1}</span>
                          <h3 className="font-semibold text-foreground">{feature.title}</h3>
                        </div>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-[26px] border border-primary/15 bg-primary/[0.04] p-5">
                <div className="flex gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Informação antes de suposição</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Quando não há contexto suficiente na base, o agente deve sinalizar essa limitação em vez de tratar uma resposta não fundamentada como informação confirmada.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-8 text-xs leading-5 text-muted-foreground">
                Projeto desenvolvido como Trabalho de Conclusão de Curso em Ciência da Computação.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
