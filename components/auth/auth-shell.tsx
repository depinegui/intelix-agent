import type { ReactNode } from "react";
import { BrainCircuit, DatabaseZap, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const bullets = [
  {
    icon: DatabaseZap,
    title: "Base de conhecimento",
    description:
      "Conteúdos organizados ajudam a orientar cada atendimento.",
  },
  {
    icon: BrainCircuit,
    title: "Contexto para a IA",
    description:
      "O assistente considera as informações disponíveis antes de responder.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso protegido",
    description:
      "Cada área respeita o perfil e as permissões do usuário.",
  },
];

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-background px-3 py-3 md:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1640px] overflow-hidden rounded-2xl border border-border bg-card shadow-[0_3px_14px_rgba(31,45,61,0.07)] md:min-h-[calc(100vh-2rem)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative overflow-hidden bg-[#111827] px-7 py-9 text-white md:px-10 lg:px-14 lg:py-12">
          <div className="pointer-events-none absolute -left-24 top-16 size-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-0 size-96 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col">
            <BrandMark inverted />

            <div className="mt-12 max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-cyan-100">
                <Sparkles className="size-4" />
                Intelix Agent
              </div>
              <p className="text-sm font-semibold tracking-[0.24em] text-cyan-300 uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.035em] md:text-5xl lg:text-[54px] lg:leading-[1.04]">
                {title}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
                {description}
              </p>
            </div>

            <div className="mt-10 grid gap-3">
              {bullets.map((bullet) => {
                const Icon = bullet.icon;
                return (
                  <div
                    key={bullet.title}
                    className="flex gap-4 rounded-lg border border-white/10 bg-white/5 p-3.5"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-cyan-300/10 text-cyan-200">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{bullet.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        {bullet.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-auto pt-8 text-xs leading-5 text-slate-500">
              Intelix Agent · Inteligência Artificial aplicada ao suporte técnico em sistemas de gestão empresarial.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-card px-7 py-10 md:px-10 lg:px-14 lg:py-12">
          <div className="w-full max-w-[520px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
