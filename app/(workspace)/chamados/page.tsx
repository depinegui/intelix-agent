import { TicketBoard } from "@/components/tickets/ticket-board";
import { requirePermission } from "@/lib/session";
import { listTickets } from "@/services/ticket-service";

export default async function TicketsPage() {
  await requirePermission("VIEW_TICKETS");
  const tickets = await listTickets();

  return <TicketBoard initialTickets={tickets} />;
}
