import type { ReactNode } from "react";
import { BrainCircuit, DatabaseZap, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";

const bullets = [
  {
    icon: BrainCircuit,
    title: "Triagem por IA",
    description:
      "Classificacao automatica de contexto, urgencia e caminho ideal de atendimento.",
  },
  {
    icon: DatabaseZap,
    title: "RAG corporativo",
    description:
      "Consulta simultanea em historico do cliente, base tecnica e conhecimento interno.",
  },
  {
    icon: ShieldCheck,
    title: "Seguranca operacional",
    description:
      "Arquitetura preparada para sessao autenticada, JWT e auditoria de atendimentos.",
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
    <main className="min-h-screen px-4 py-6 md:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-[1560px] gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="hero-shell relative overflow-hidden rounded-[36px] px-6 py-8 text-white shadow-[0_26px_80px_rgba(10,19,32,0.28)] md:px-10 md:py-10 lg:px-14 lg:py-12">
          <div className="relative z-10 flex h-full flex-col">
            <BrandMark inverted />
            <div className="mt-14 max-w-2xl space-y-4">
              <p className="text-sm font-semibold tracking-[0.26em] text-cyan-200/88 uppercase">
                {eyebrow}
              </p>
              <h1 className="text-4xl leading-tight font-semibold md:text-5xl lg:text-[58px] lg:leading-[1.05]">
                {title}
              </h1>
              <p className="max-w-xl text-sm leading-7 text-white/72 md:text-base">
                {description}
              </p>
            </div>

            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {bullets.map((bullet) => (
                <div
                  key={bullet.title}
                  className="rounded-[28px] border border-white/10 bg-white/7 p-5"
                >
                  <bullet.icon className="mb-4 size-6 text-cyan-200" />
                  <p className="text-base font-semibold">{bullet.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/70">
                    {bullet.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-auto rounded-[28px] border border-white/10 bg-white/7 p-6">
              <p className="text-sm text-white/72">Acesso de demonstracao</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-[22px] border border-white/8 bg-black/12 p-4">
                  <p className="text-xs tracking-[0.2em] text-white/54 uppercase">
                    Usuario
                  </p>
                  <p className="mt-2 text-base font-semibold">
                    analista@intelix.ai
                  </p>
                </div>
                <div className="rounded-[22px] border border-white/8 bg-black/12 p-4">
                  <p className="text-xs tracking-[0.2em] text-white/54 uppercase">
                    Senha
                  </p>
                  <p className="mt-2 text-base font-semibold">Intelix@2026</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="surface-card flex items-center justify-center p-6 md:p-8 lg:p-12">
          <div className="w-full max-w-[520px]">{children}</div>
        </section>
      </div>
    </main>
  );
}
