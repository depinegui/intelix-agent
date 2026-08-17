"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { Edit3 } from "lucide-react";
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
      <div className="surface-card p-6">
        <div className="mb-5 grid gap-4 md:grid-cols-[1fr_220px]">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-12 rounded-2xl"
            placeholder="Buscar por protocolo, titulo ou descricao"
          />
          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value ?? "TODOS")}
          >
            <SelectTrigger className="h-12 w-full rounded-2xl">
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

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Protocolo</TableHead>
              <TableHead>Titulo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Atualizado em</TableHead>
              <TableHead className="text-right">Acoes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell className="font-semibold">{ticket.protocol}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{ticket.title}</p>
                    <p className="max-w-[440px] truncate text-sm text-muted-foreground">
                      {ticket.description}
                    </p>
                  </div>
                </TableCell>
                <TableCell>{categoryLabels[ticket.category]}</TableCell>
                <TableCell>{priorityLabels[ticket.priority]}</TableCell>
                <TableCell>
                  <Badge className={badgeTone(ticket.status)} variant="secondary">
                    {statusLabels[ticket.status]}
                  </Badge>
                </TableCell>
                <TableCell>{formatDateTime(ticket.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    className="rounded-2xl"
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setNextStatus(ticket.status);
                      setNote("");
                    }}
                  >
                    <Edit3 className="size-4" />
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null);
          }
        }}
      >
        <DialogContent className="max-w-xl rounded-[28px] p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Atualizar chamado</DialogTitle>
            <DialogDescription>
              Ajuste o status e registre uma observacao operacional no historico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-6 pb-6">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={nextStatus}
                onValueChange={(value) => setNextStatus(value as TicketStatus)}
              >
                <SelectTrigger className="h-12 w-full rounded-2xl">
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
                className="rounded-2xl"
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
