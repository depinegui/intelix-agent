import type { ReactNode } from "react";
import { BrainCircuit, DatabaseZap, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const bullets = [
  {
    icon: DatabaseZap,
    title: "Base de conhecimento",
    description:
      "Conteúdos indexados apoiam a recuperação das informações utilizadas pelo agente.",
  },
  {
    icon: BrainCircuit,
    title: "Contexto para a IA",
    description:
      "O modelo recebe os trechos recuperados como contexto antes de construir a resposta.",
  },
  {
    icon: ShieldCheck,
    title: "Acesso protegido",
    description:
      "A autenticação mantém o acesso às áreas internas vinculado à sessão do usuário.",
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
    <main className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,rgba(21,184,205,0.12),transparent_30%),radial-gradient(circle_at_85%_80%,rgba(21,184,205,0.08),transparent_30%)] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1480px] overflow-hidden rounded-[36px] border border-border/70 bg-white shadow-[0_28px_90px_rgba(15,23,42,0.12)] md:min-h-[calc(100vh-3rem)] lg:grid-cols-[0.96fr_1.04fr]">
        <section className="relative overflow-hidden bg-[#0e1b2d] px-7 py-10 text-white md:px-10 lg:px-14 lg:py-14">
          <div className="pointer-events-none absolute -left-24 top-16 size-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 right-0 size-96 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col">
            <BrandMark inverted />

            <div className="mt-12 max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-cyan-100">
                <Sparkles className="size-4" />
                Intelix Agent
              </div>
              <p className="text-sm font-semibold tracking-[0.24em] text-cyan-300 uppercase">
                {eyebrow}
              </p>
              <h1 className="mt-5 text-4xl leading-tight font-semibold tracking-[-0.035em] md:text-5xl lg:text-[58px] lg:leading-[1.04]">
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
                    className="flex gap-4 rounded-[22px] border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200">
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

            <p className="mt-auto pt-10 text-xs leading-5 text-slate-500">
              Intelix Agent · Inteligência Artificial aplicada ao suporte técnico em sistemas de gestão empresarial.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white px-7 py-10 md:px-10 lg:px-14 lg:py-14">
          <div className="w-full max-w-[520px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
