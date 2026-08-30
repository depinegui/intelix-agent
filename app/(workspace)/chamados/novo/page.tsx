import { NewTicketForm } from "@/components/tickets/new-ticket-form";
import { requirePermission } from "@/lib/session";
import { getProtocolPreview } from "@/services/ticket-service";

export default async function NewTicketPage() {
  await requirePermission("CREATE_TICKET");
  return <NewTicketForm protocolPreview={getProtocolPreview()} />;
}
