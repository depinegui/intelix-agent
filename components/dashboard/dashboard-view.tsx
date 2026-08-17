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

export function DashboardView({ snapshot }: DashboardViewProps) {
  return (
    <div className="grid gap-4">
      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshot.metrics.map((metric) => (
            <Card
              key={metric.label}
              className="metric-glow rounded-[28px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]"
            >
              <CardHeader className="gap-3 px-5 pt-5">
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="text-4xl font-semibold">
                  {metric.value}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <p className="text-sm leading-6 text-muted-foreground">
                  {metric.detail}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-[30px] border-none bg-[#f4fbfc] shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
          <CardHeader className="gap-3 px-6 pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardDescription>Base de Conhecimento</CardDescription>
                <CardTitle className="text-4xl font-semibold">
                  {snapshot.indexedDocs}
                </CardTitle>
              </div>
              <div className="rounded-2xl bg-white/80 p-3 text-primary">
                <Database className="size-6" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 px-6 pb-6">
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
            <div className="rounded-[24px] border border-border/60 bg-white/85 p-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Clock3 className="size-4" />
                Tempo medio de atendimento
              </div>
              <p className="mt-3 text-3xl font-semibold text-foreground">
                {snapshot.averageMinutes} min
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="rounded-[30px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
          <CardHeader className="px-6 pt-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardDescription>Atendimentos da Semana</CardDescription>
                <CardTitle className="text-2xl font-semibold">
                  Volume operacional
                </CardTitle>
              </div>
              <div className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground">
                <TrendingUp className="mr-2 inline size-4" />
                Pico em sexta-feira
              </div>
            </div>
          </CardHeader>
          <CardContent className="h-[350px] px-2 pb-4 md:px-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={snapshot.weeklyVolume}>
                <defs>
                  <linearGradient id="intelixPrimary" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#08b2c6" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#08b2c6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="intelixSecondary" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#31405d" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#31405d" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke="#dbe6eb" />
                <XAxis
                  axisLine={false}
                  dataKey="day"
                  tickLine={false}
                  tick={{ fill: "#708195", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 18,
                    border: "1px solid #dde7ec",
                    boxShadow: "0 18px 36px rgba(15,24,40,0.12)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="assisted"
                  stroke="#08b2c6"
                  fill="url(#intelixPrimary)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="escalated"
                  stroke="#31405d"
                  fill="url(#intelixSecondary)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-[30px] border-none shadow-[0_18px_48px_rgba(15,24,40,0.08)]">
          <CardHeader className="px-6 pt-6">
            <CardDescription>Chamados Recentes</CardDescription>
            <CardTitle className="text-2xl font-semibold">
              Fila acompanhada pelo agente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {snapshot.recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="rounded-[24px] border border-border/70 bg-muted/45 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {ticket.protocol}
                    </p>
                    <p className="mt-1 text-base text-foreground">{ticket.title}</p>
                  </div>
                  <Badge
                    className={ticketBadgeVariant(ticket.status)}
                    variant="secondary"
                  >
                    {statusLabels[ticket.status]}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {ticket.description}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
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
