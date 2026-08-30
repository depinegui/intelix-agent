import { demoStore, prototypeDashboard } from "@/database/demo-store";
import { prisma } from "@/lib/prisma";
import { listTickets } from "@/services/ticket-service";
import type { DashboardSnapshot, TicketStatus } from "@/types";

const RECENT_TICKETS_LIMIT = 4;
const WEEKDAY_LABELS = [
  "domingo",
  "segunda-feira",
  "terca-feira",
  "quarta-feira",
  "quinta-feira",
  "sexta-feira",
  "sabado",
];
const WEEKDAY_SHORT_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

type WeeklyTicket = {
  createdAt: Date;
  status: TicketStatus;
};

function startOfDay(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function getWeeklyVolume(tickets: WeeklyTicket[], now: Date) {
  const today = startOfDay(now);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (6 - index));

    return {
      day: WEEKDAY_SHORT_LABELS[date.getDay()],
      weekdayName: WEEKDAY_LABELS[date.getDay()],
      key: dateKey(date),
      total: 0,
      assisted: 0,
      escalated: 0,
    };
  });
  const daysByKey = new Map(days.map((day) => [day.key, day]));

  for (const ticket of tickets) {
    const day = daysByKey.get(dateKey(ticket.createdAt));

    if (!day) continue;

    day.total += 1;
    // As series existentes representam atendimentos resolvidos pela IA e escalados.
    if (ticket.status === "IA_RESOLVIDO") day.assisted += 1;
    if (ticket.status === "ESCALADO") day.escalated += 1;
  }

  const peakDay = days.reduce((current, day) =>
    day.total > current.total ? day : current,
  );

  return {
    weeklyVolume: days.map(({ key: _key, weekdayName: _weekdayName, ...day }) => day),
    weeklyPeakLabel:
      peakDay.total > 0 ? `Pico em ${peakDay.weekdayName}` : "Sem atendimentos",
  };
}

function toPercentage(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function createSnapshot({
  totalTickets,
  handledToday,
  resolvedByAi,
  escalated,
  indexedDocs,
  weeklyTickets,
  recentTickets,
  now,
}: {
  totalTickets: number;
  handledToday: number;
  resolvedByAi: number;
  escalated: number;
  indexedDocs: number;
  weeklyTickets: WeeklyTicket[];
  recentTickets: DashboardSnapshot["recentTickets"];
  now: Date;
}): DashboardSnapshot {
  const resolutionRate = toPercentage(resolvedByAi, totalTickets);
  const handoffRate = toPercentage(escalated, totalTickets);
  const { weeklyVolume, weeklyPeakLabel } = getWeeklyVolume(weeklyTickets, now);

  return {
    metrics: [
      {
        label: "Chamados",
        value: `${totalTickets}`,
        detail: "Base historica acompanhada pelo agente",
      },
      {
        label: "Atendimentos hoje",
        value: `${handledToday}`,
        detail: "Fila atual com triagem inteligente",
      },
      {
        label: "Resolvidos pela IA",
        value: `${resolutionRate}%`,
        detail: "Taxa de resolucao sem escalonamento",
      },
      {
        label: "Encaminhados",
        value: `${handoffRate}%`,
        detail: "Demandas com apoio de especialista",
      },
    ],
    indexedDocs,
    resolutionRate,
    handoffRate,
    // Ticket ainda nao registra um marco confiavel de inicio/fim do atendimento.
    // Manter o valor atual ate que esse dado esteja disponivel para o calculo real.
    averageMinutes: prototypeDashboard.averageMinutes,
    weeklyVolume,
    weeklyPeakLabel,
    recentTickets,
  };
}

function getDemoSnapshot(now: Date): DashboardSnapshot {
  const todayStart = startOfDay(now);
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6);
  const tickets = demoStore.tickets.map((ticket) => ({
    ...ticket,
    createdAt: new Date(ticket.createdAt),
    updatedAt: new Date(ticket.updatedAt),
  }));

  return createSnapshot({
    totalTickets: tickets.length,
    handledToday: tickets.filter((ticket) => ticket.createdAt >= todayStart).length,
    resolvedByAi: tickets.filter((ticket) => ticket.status === "IA_RESOLVIDO").length,
    escalated: tickets.filter((ticket) => ticket.status === "ESCALADO").length,
    indexedDocs: demoStore.knowledge.length,
    weeklyTickets: tickets.filter((ticket) => ticket.createdAt >= weekStart),
    recentTickets: [...demoStore.tickets]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, RECENT_TICKETS_LIMIT),
    now,
  });
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const now = new Date();

  if (!prisma) return getDemoSnapshot(now);

  const todayStart = startOfDay(now);
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - 6);

  try {
    const [
      totalTickets,
      handledToday,
      resolvedByAi,
      escalated,
      indexedDocs,
      weeklyTickets,
      recentTickets,
    ] = await Promise.all([
      prisma.ticket.count(),
      prisma.ticket.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.ticket.count({ where: { status: "IA_RESOLVIDO" } }),
      prisma.ticket.count({ where: { status: "ESCALADO" } }),
      prisma.knowledgeDocument.count(),
      prisma.ticket.findMany({
        where: { createdAt: { gte: weekStart } },
        select: { createdAt: true, status: true },
      }),
      listTickets(RECENT_TICKETS_LIMIT),
    ]);

    return createSnapshot({
      totalTickets,
      handledToday,
      resolvedByAi,
      escalated,
      indexedDocs,
      weeklyTickets,
      recentTickets,
      now,
    });
  } catch {
    return getDemoSnapshot(now);
  }
}
