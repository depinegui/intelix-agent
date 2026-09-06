ALTER TYPE "TicketCategory" ADD VALUE IF NOT EXISTS 'SUPORTE_GERAL';

ALTER TABLE "ChatMessage"
  ADD COLUMN "feedbackReason" TEXT,
  ADD COLUMN "feedbackComment" TEXT,
  ADD COLUMN "feedbackAt" TIMESTAMP(3),
  ADD COLUMN "escalatedTicketId" TEXT;

ALTER TABLE "Ticket"
  ADD COLUMN "chatEscalationMessageId" TEXT;

CREATE UNIQUE INDEX "ChatMessage_escalatedTicketId_key"
  ON "ChatMessage"("escalatedTicketId");

CREATE UNIQUE INDEX "Ticket_chatEscalationMessageId_key"
  ON "Ticket"("chatEscalationMessageId");
