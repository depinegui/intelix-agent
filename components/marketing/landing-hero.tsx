import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  DatabaseZap,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const capabilities = [
  "Inteligência Artificial",
  "Retrieval-Augmented Generation",
  "Base de conhecimento especializada",
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
                Inteligência Artificial aplicada ao suporte técnico
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
                  Um agente de Inteligência Artificial desenvolvido para auxiliar
                  usuários na resolução de dúvidas operacionais relacionadas a
                  sistemas de gestão empresarial.
                </p>
                <h1 className="max-w-3xl text-4xl leading-tight font-semibold md:text-5xl lg:text-[66px] lg:leading-[1.02]">
                  Suporte inteligente para sistemas de gestão.
                </h1>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[28px] border border-white/10 bg-white/7 p-5">
                  <BrainCircuit className="mb-4 size-7 text-cyan-200" />
                  <p className="text-base font-semibold">Respostas contextualizadas</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    O agente utiliza informações recuperadas da base de
                    conhecimento para apoiar a geração das respostas.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/7 p-5">
                  <DatabaseZap className="mb-4 size-7 text-cyan-200" />
                  <p className="text-base font-semibold">Base de conhecimento</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Documentos e informações são indexados para permitir
                    recuperação de conteúdo relevante durante as consultas.
                  </p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/7 p-5">
                  <MessageSquareText className="mb-4 size-7 text-cyan-200" />
                  <p className="text-base font-semibold">Interação natural</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    Perguntas podem ser realizadas em linguagem natural por meio
                    da interface de conversação do Intelix.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex flex-col gap-4 pt-10 md:flex-row md:items-center md:justify-between">
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 rounded-2xl px-6",
                )}
              >
                Acessar o Intelix
                <ArrowRight className="size-4" />
              </Link>
              <div className="rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm text-white/74">
                Agente de IA com recuperação de informações via RAG
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card flex flex-col justify-between p-6 md:p-8">
          <div>
            <div className="flex items-center justify-between gap-3">
              <BrandMark compact />
              <div className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                Intelix Agent
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <p className="text-sm font-semibold tracking-[0.24em] text-primary/80 uppercase">
                Inteligência aplicada ao suporte
              </p>
              <h2 className="text-3xl leading-tight font-semibold text-foreground md:text-[40px]">
                Conhecimento especializado para apoiar cada atendimento.
              </h2>
              <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
                O Intelix combina modelos de linguagem e recuperação de
                informações para consultar uma base de conhecimento antes de
                construir respostas relacionadas ao contexto de sistemas ERP.
              </p>
            </div>
          </div>

          <div className="mt-8 space-y-5">
            <div className="grid gap-3">
              <div className="rounded-[24px] border border-border/70 bg-muted/55 p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary/12 p-3 text-primary">
                    <DatabaseZap className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Recuperação de conhecimento
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      O RAG localiza informações relevantes nos documentos
                      indexados e fornece esse contexto ao modelo de linguagem.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-border/70 bg-muted/55 p-5">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-primary/12 p-3 text-primary">
                    <ShieldCheck className="size-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      Respostas fundamentadas
                    </p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      Quando a base não oferece contexto suficiente, o agente
                      evita apresentar uma resposta como informação confirmada.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="teal-outline rounded-[30px] border border-primary/14 bg-card p-6">
              <p className="text-sm font-semibold tracking-[0.18em] text-primary/80 uppercase">
                Intelix Agent
              </p>
              <p className="mt-3 text-xl font-semibold text-foreground">
                Agente autônomo de Inteligência Artificial para suporte técnico
                em sistemas de gestão empresarial.
              </p>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Desenvolvido como Trabalho de Conclusão de Curso em Ciência da
                Computação.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
