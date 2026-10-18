"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, MessageSquareText, RefreshCw, Star, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { Button } from "@/components/ui/button";
import { productEvaluationQuestions } from "@/lib/product-evaluation";

type ScoreKey = (typeof productEvaluationQuestions)[number]["key"];

interface EvaluationSummary {
  invitedCount: number;
  responseCount: number;
  averages: Array<{
    key: ScoreKey;
    label: string;
    value: number | null;
  }>;
  responses: Array<{
    id: string;
    userName: string;
    userEmail: string;
    easeOfUse: number;
    relevance: number;
    responseTime: number;
    reuseIntent: number;
    comment: string | null;
    createdAt: string;
  }>;
}

function formatAverage(value: number | null) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 1,
        maximumFractionDigits: 1,
      }).format(value);
}

export function EvaluationsView() {
  const [data, setData] = useState<EvaluationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadSummary() {
    setLoading(true);

    try {
      setData(await apiRequest<EvaluationSummary>("/api/admin/avaliacoes"));
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as avaliações.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  const participation = data?.invitedCount
    ? Math.round((data.responseCount / data.invitedCount) * 100)
    : 0;

  return (
    <section className="space-y-3">
      <div className="surface-card flex flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <ClipboardCheck className="size-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">
              Avaliações do Intelix Agent
            </h2>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Acompanhe a participação e as respostas enviadas pelo grupo de testes da Microsys.
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadSummary()} disabled={loading}>
          <RefreshCw className={loading ? "size-4 animate-spin" : "size-4"} />
          Atualizar
        </Button>
      </div>

      {loading && !data ? (
        <div className="surface-card px-6 py-12 text-center text-sm text-muted-foreground">
          Carregando avaliações...
        </div>
      ) : data ? (
        <>
          <div className="grid gap-3 md:grid-cols-3">
            <SummaryCard icon={UsersRound} label="Usuários convidados" value={String(data.invitedCount)} />
            <SummaryCard icon={ClipboardCheck} label="Avaliações respondidas" value={`${data.responseCount} de ${data.invitedCount}`} />
            <SummaryCard icon={Star} label="Participação" value={`${participation}%`} />
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.averages.map((average, index) => (
              <div key={average.key} className="surface-card p-5">
                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  Questão {index + 1}
                </p>
                <p className="mt-2 text-3xl font-semibold text-foreground">
                  {formatAverage(average.value)}<span className="text-base text-muted-foreground"> / 5</span>
                </p>
                <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground" title={average.label}>
                  {average.label}
                </p>
              </div>
            ))}
          </div>

          <div className="surface-card overflow-hidden">
            <div className="border-b border-border/70 px-5 py-4 md:px-6">
              <div className="flex items-center gap-2">
                <MessageSquareText className="size-4 text-primary" />
                <h3 className="font-semibold text-foreground">Respostas individuais</h3>
              </div>
            </div>

            {data.responses.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-muted-foreground">
                Nenhuma avaliação foi respondida ainda.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[960px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border/70 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase">
                      <th className="px-5 py-3 md:px-6">Usuário</th>
                      <th className="px-3 py-3">Respondido em</th>
                      <th className="px-3 py-3 text-center">Q1</th>
                      <th className="px-3 py-3 text-center">Q2</th>
                      <th className="px-3 py-3 text-center">Q3</th>
                      <th className="px-3 py-3 text-center">Q4</th>
                      <th className="px-3 py-3 pr-5 md:pr-6">Comentário</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.responses.map((response) => (
                      <tr key={response.id} className="border-b border-border/50 align-top last:border-0">
                        <td className="px-5 py-4 md:px-6">
                          <p className="font-semibold text-foreground">{response.userName}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{response.userEmail}</p>
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-muted-foreground">
                          {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(response.createdAt))}
                        </td>
                        <ScoreCell value={response.easeOfUse} />
                        <ScoreCell value={response.relevance} />
                        <ScoreCell value={response.responseTime} />
                        <ScoreCell value={response.reuseIntent} />
                        <td className="max-w-sm px-3 py-4 pr-5 text-sm leading-5 text-muted-foreground md:pr-6">
                          {response.comment || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card p-5">
      <Icon className="size-5 text-primary" />
      <p className="mt-4 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function ScoreCell({ value }: { value: number }) {
  return <td className="px-3 py-4 text-center font-semibold text-foreground">{value}/5</td>;
}
