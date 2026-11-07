"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { Clock3, Database, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DashboardSnapshot, TicketRecord } from "@/types";
import { formatDateTime, statusLabels } from "@/utils/format";

interface DashboardViewProps {
  snapshot: DashboardSnapshot;
}

function ticketBadgeVariant(status: TicketRecord["status"]) {
  if (status === "IA_RESOLVIDO") {
    return "bg-secondary text-secondary-foreground";
  }

  if (status === "ESCALADO") {
    return "bg-destructive/10 text-destructive";
  }

  return "bg-muted text-muted-foreground";
}

function formatDecimal(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatResponseTime(value: number | null) {
  return value === null ? "Nao medido" : `${formatDecimal(value / 1000)} s`;
}

function formatPercentage(value: number | null, emptyLabel: string) {
  return value === null ? emptyLabel : `${value}%`;
}

function formatSources(value: number | null) {
  if (value === null) return "Nao medido";

  return `${formatDecimal(value)} ${value === 1 ? "fonte" : "fontes"}`;
}

export function DashboardView({ snapshot }: DashboardViewProps) {
  return (
    <div className="grid items-start gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(300px,0.45fr)]">
      <section aria-label="Indicadores e atendimentos da semana" className="grid min-w-0 gap-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshot.metrics.map((metric) => (
            <Card
              key={metric.label}
              className="metric-glow gap-2 py-3 shadow-sm"
            >
              <CardHeader className="gap-1 px-4">
                <CardDescription className="text-xs font-semibold tracking-[0.08em] uppercase">
                  {metric.label}
                </CardDescription>
                <CardTitle className="text-2xl font-semibold tracking-[-0.025em]">
                  {metric.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4">
                <p className="text-xs leading-5 text-muted-foreground">
                  {metric.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/70 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardDescription>Atendimentos da Semana</CardDescription>
                <CardTitle className="text-xl font-semibold">
                  Volume operacional
                </CardTitle>
              </div>
              <div className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
                <TrendingUp className="mr-2 inline size-4" />
                {snapshot.weeklyPeakLabel}
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[320px] px-2 pb-3 md:px-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot.weeklyVolume}>
                <defs>
                  <linearGradient id="intelixPrimary" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#178a98" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="#178a98" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="intelixSecondary" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#34465d" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#34465d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke="#d8e1e7" />
                <XAxis
                  axisLine={false}
                  dataKey="day"
                  tickLine={false}
                  tick={{ fill: "#6b7b8d", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #d6e0e7",
                    background: "#fbfcfd",
                    boxShadow: "0 3px 10px rgba(31,45,61,0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="assisted"
                  stroke="#178a98"
                  fill="url(#intelixPrimary)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="escalated"
                  stroke="#34465d"
                  fill="url(#intelixSecondary)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section aria-label="Base de conhecimento e chamados recentes" className="grid min-w-0 gap-3">
        <Card className="border-border bg-card shadow-[0_1px_2px_rgba(31,45,61,0.035)]">
          <CardHeader className="gap-2 px-5 pt-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardDescription className="text-xs font-semibold tracking-[0.08em] uppercase">Base de conhecimento</CardDescription>
                <CardTitle className="text-3xl font-semibold">
                  {snapshot.indexedDocs}
                </CardTitle>
              </div>
              <div className="rounded-lg border border-primary/15 bg-secondary/60 p-2.5 text-primary">
                <Database className="size-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Resolucao pela IA</span>
                <span>{snapshot.resolutionRate}%</span>
              </div>
              <Progress value={snapshot.resolutionRate} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Encaminhamento humano</span>
                <span>{snapshot.handoffRate}%</span>
              </div>
              <Progress value={snapshot.handoffRate} />
            </div>
            <div className="rounded-lg border border-border/80 bg-background/55 p-3.5">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                Tempo medio de resposta da IA
              </div>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {formatResponseTime(snapshot.averageAiResponseTimeMs)}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-border/75 bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Respostas com contexto</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatPercentage(snapshot.contextCoverageRate, "Nao medido")}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Apoiadas por conteudo recuperado
                </p>
              </div>
              <div className="rounded-lg border border-border/75 bg-background/50 p-3">
                <p className="text-xs text-muted-foreground">Respostas uteis</p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatPercentage(snapshot.helpfulFeedbackRate, "Sem avaliacoes")}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Entre respostas avaliadas
                </p>
              </div>
              <div className="rounded-lg border border-border/75 bg-background/50 p-3 sm:col-span-2">
                <p className="text-xs text-muted-foreground">
                  Fontes medias por resposta
                </p>
                <p className="mt-2 text-xl font-semibold text-foreground">
                  {formatSources(snapshot.averageSourcesPerResponse)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="border-b border-border/70 px-5 py-4">
            <CardDescription className="text-xs font-semibold tracking-[0.08em] uppercase">Chamados recentes</CardDescription>
            <CardTitle className="text-xl font-semibold">
              Fila acompanhada pelo agente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 px-5 py-4">
            {snapshot.recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-lg border border-border/70 bg-muted/30 p-3.5 transition-colors hover:bg-muted/55"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {ticket.protocol}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">{ticket.title}</p>
                  </div>
                  <Badge
                    className={ticketBadgeVariant(ticket.status)}
                    variant="secondary"
                  >
                    {statusLabels[ticket.status]}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-5 text-muted-foreground">
                  {ticket.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Atualizado em {formatDateTime(ticket.updatedAt)}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
