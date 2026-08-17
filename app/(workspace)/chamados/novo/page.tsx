import { NewTicketForm } from "@/components/tickets/new-ticket-form";
import { getProtocolPreview } from "@/services/ticket-service";

export default function NewTicketPage() {
  return <NewTicketForm protocolPreview={getProtocolPreview()} />;
}
