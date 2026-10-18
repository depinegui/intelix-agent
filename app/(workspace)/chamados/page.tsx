import { TicketBoard } from "@/components/tickets/ticket-board";
import { requirePermission } from "@/lib/session";
import { listTickets } from "@/services/ticket-service";

export default async function TicketsPage() {
  const user = await requirePermission("VIEW_TICKETS");
  const tickets = await listTickets({
    requesterId: user.role === "ADMIN" ? undefined : user.id,
  });

  return (
    <TicketBoard
      initialTickets={tickets}
      canFilterByRequester={user.role === "ADMIN"}
    />
  );
}
