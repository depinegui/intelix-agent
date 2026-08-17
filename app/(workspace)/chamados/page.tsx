import { TicketBoard } from "@/components/tickets/ticket-board";
import { listTickets } from "@/services/ticket-service";

export default async function TicketsPage() {
  const tickets = await listTickets();

  return <TicketBoard initialTickets={tickets} />;
}
