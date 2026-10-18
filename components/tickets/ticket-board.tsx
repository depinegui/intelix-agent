"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { BotMessageSquare, Clock3, Edit3, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { apiRequest } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { TicketRecord, TicketStatus } from "@/types";
import {
  categoryLabels,
  formatDateTime,
  priorityLabels,
  statusLabels,
} from "@/utils/format";

const statuses: TicketStatus[] = [
  "ABERTO",
  "EM_TRIAGEM",
  "EM_ANDAMENTO",
  "IA_RESOLVIDO",
  "ESCALADO",
  "FECHADO",
];

function badgeTone(status: TicketStatus) {
  if (status === "IA_RESOLVIDO") {
    return "bg-secondary text-secondary-foreground";
  }

  if (status === "ESCALADO") {
    return "bg-destructive/10 text-destructive";
  }

  if (status === "EM_ANDAMENTO") {
    return "bg-primary/10 text-primary";
  }

  return "bg-muted text-muted-foreground";
}

interface TicketBoardProps {
  initialTickets: TicketRecord[];
}

export function TicketBoard({ initialTickets }: TicketBoardProps) {
  const [tickets, setTickets] = useState(initialTickets);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("TODOS");
  const [viewingTicket, setViewingTicket] = useState<TicketRecord | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [nextStatus, setNextStatus] = useState<TicketStatus>("EM_ANDAMENTO");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const deferredSearch = useDeferredValue(search);
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesStatus =
        statusFilter === "TODOS" || ticket.status === statusFilter;
      const haystack = `${ticket.protocol} ${ticket.title} ${ticket.description}`.toLowerCase();
      const matchesSearch = haystack.includes(deferredSearch.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [deferredSearch, statusFilter, tickets]);

  async function handleUpdate() {
    if (!selectedTicket) {
      return;
    }

    setLoading(true);
    try {
      const payload = await apiRequest<{ ticket: TicketRecord }>(
        `/api/tickets/${selectedTicket.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: nextStatus,
            note,
          }),
        },
      );

      setTickets((current) =>
        current.map((ticket) =>
          ticket.id === payload.ticket.id ? payload.ticket : ticket,
        ),
      );
      setViewingTicket((current) =>
        current?.id === payload.ticket.id ? payload.ticket : current,
      );
      toast.success("Chamado atualizado.");
      setSelectedTicket(null);
      setNote("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Falha ao atualizar o chamado.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="surface-card overflow-hidden">
        <div className="grid gap-3 border-b border-border/70 bg-muted/20 p-4 md:grid-cols-[1fr_210px] md:p-5">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 rounded-lg bg-background/70"
            placeholder="Buscar por protocolo, titulo ou descricao"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value ?? "TODOS")}
          >
            <SelectTrigger className="h-10 w-full rounded-lg bg-background/70">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos os status</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Titulo</TableHead>
              <TableHead className="hidden 2xl:table-cell">Categoria</TableHead>
              <TableHead className="hidden 2xl:table-cell">Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow
                key={ticket.id}
                role="button"
                tabIndex={0}
                onClick={() => setViewingTicket(ticket)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setViewingTicket(ticket);
                  }
                }}
                className="cursor-pointer transition-colors hover:bg-muted/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <TableCell className="font-semibold">{ticket.protocol}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{ticket.title}</p>
                    <p className="max-w-[360px] truncate text-sm text-muted-foreground">
                      {ticket.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden 2xl:table-cell">
                  {categoryLabels[ticket.category]}
                </TableCell>
                <TableCell className="hidden 2xl:table-cell">
                  {priorityLabels[ticket.priority]}
                </TableCell>
                <TableCell>
                  <Badge className={badgeTone(ticket.status)} variant="secondary">
                    {statusLabels[ticket.status]}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(ticket.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      className="h-8 rounded-md"
                      onClick={(event) => {
                        event.stopPropagation();
                        setViewingTicket(ticket);
                      }}
                    >
                      <Eye className="size-4" />
                      Ver
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 rounded-md"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedTicket(ticket);
                        setNextStatus(ticket.status);
                        setNote("");
                      }}
                    >
                      <Edit3 className="size-4" />
                      Editar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
      </div>

      <Dialog
        open={Boolean(viewingTicket)}
        onOpenChange={(open) => {
          if (!open) {
            setViewingTicket(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-xl p-0 sm:max-w-3xl">
          {viewingTicket && (
            <>
              <DialogHeader className="border-b border-border/70 px-5 py-4 md:px-6">
                <div className="flex flex-wrap items-center gap-2 pr-8">
                  <DialogTitle>Chamado {viewingTicket.protocol}</DialogTitle>
                  <Badge className={badgeTone(viewingTicket.status)} variant="secondary">
                    {statusLabels[viewingTicket.status]}
                  </Badge>
                </div>
                <DialogDescription>{viewingTicket.title}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 px-5 py-5 md:px-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <DetailItem label="Categoria" value={categoryLabels[viewingTicket.category]} />
                  <DetailItem label="Prioridade" value={priorityLabels[viewingTicket.priority]} />
                  <DetailItem label="Solicitante" value={viewingTicket.requesterName} />
                </div>

                <DetailSection icon={FileText} title="Descrição">
                  <p className="whitespace-pre-wrap leading-6 text-muted-foreground">
                    {viewingTicket.description}
                  </p>
                </DetailSection>

                {viewingTicket.aiSummary && (
                  <DetailSection icon={BotMessageSquare} title="Resumo da IA">
                    <p className="whitespace-pre-wrap leading-6 text-muted-foreground">
                      {viewingTicket.aiSummary}
                    </p>
                  </DetailSection>
                )}

                {viewingTicket.resolutionNotes && (
                  <DetailSection icon={FileText} title="Solução registrada">
                    <p className="whitespace-pre-wrap leading-6 text-muted-foreground">
                      {viewingTicket.resolutionNotes}
                    </p>
                  </DetailSection>
                )}

                <DetailSection icon={Clock3} title="Histórico">
                  <div className="space-y-3">
                    {viewingTicket.histories.map((history) => (
                      <div key={history.id} className="rounded-lg border border-border/70 bg-muted/25 p-3.5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <p className="font-medium text-foreground">{history.action}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(history.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{history.actorName}</p>
                        {history.note && (
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {history.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </DetailSection>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null);
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-xl p-0">
          <DialogHeader className="border-b border-border/70 px-5 py-4">
            <DialogTitle>Atualizar chamado</DialogTitle>
            <DialogDescription>
              Ajuste o status e registre uma observacao operacional no historico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-5 py-5">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={nextStatus}
                onValueChange={(value) => setNextStatus(value as TicketStatus)}
              >
                <SelectTrigger className="h-10 w-full rounded-lg">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-note">Observacao</Label>
              <Textarea
                id="ticket-note"
                rows={5}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="rounded-lg"
                placeholder="Descreva a atualizacao realizada."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={loading}>
              {loading ? "Salvando..." : "Salvar atualizacao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 bg-muted/25 p-3">
      <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function DetailSection({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof FileText;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="flex items-center gap-2 font-semibold text-foreground">
        <Icon className="size-4 text-primary" />
        {title}
      </h3>
      {children}
    </section>
  );
}
