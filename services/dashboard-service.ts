import { prototypeDashboard } from "@/database/demo-store";
import { listKnowledgeDocuments } from "@/services/knowledge-service";
import { listTickets } from "@/services/ticket-service";
import type { DashboardSnapshot } from "@/types";

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const [tickets, knowledge] = await Promise.all([
    listTickets(),
    listKnowledgeDocuments(),
  ]);

  return {
    metrics: [
      {
        label: "Chamados",
        value: `${prototypeDashboard.totalTickets}`,
        detail: "Base historica acompanhada pelo agente",
      },
      {
        label: "Atendimentos hoje",
        value: `${prototypeDashboard.handledToday}`,
        detail: "Fila atual com triagem inteligente",
      },
      {
        label: "Resolvidos pela IA",
        value: `${prototypeDashboard.resolutionRate}%`,
        detail: "Taxa de resolucao sem escalonamento",
      },
      {
        label: "Encaminhados",
        value: `${prototypeDashboard.handoffRate}%`,
        detail: "Demandas com apoio de especialista",
      },
    ],
    indexedDocs: Math.max(prototypeDashboard.indexedDocs, knowledge.length),
    resolutionRate: prototypeDashboard.resolutionRate,
    handoffRate: prototypeDashboard.handoffRate,
    averageMinutes: prototypeDashboard.averageMinutes,
    weeklyVolume: [
      { day: "Seg", total: 18, assisted: 12, escalated: 6 },
      { day: "Ter", total: 24, assisted: 15, escalated: 9 },
      { day: "Qua", total: 21, assisted: 14, escalated: 7 },
      { day: "Qui", total: 26, assisted: 18, escalated: 8 },
      { day: "Sex", total: 29, assisted: 20, escalated: 9 },
      { day: "Sab", total: 17, assisted: 12, escalated: 5 },
      { day: "Dom", total: 12, assisted: 9, escalated: 3 },
    ],
    recentTickets: tickets.slice(0, 4),
  };
}
