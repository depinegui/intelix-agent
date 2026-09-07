import { Prisma, PrismaClient } from "@prisma/client";
import {
  seedConversations,
  seedKnowledgeDocuments,
  seedMessages,
  seedTickets,
  seedUsers,
} from "@/database/demo-store";

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("O seed de demonstracao nao pode ser executado em producao.");
  }

  if (!process.env.INTELIX_DEMO_PASSWORD) {
    throw new Error("Defina INTELIX_DEMO_PASSWORD antes de executar o seed local.");
  }

  await prisma.chatMessage.deleteMany();
  await prisma.chatConversation.deleteMany();
  await prisma.ticketHistory.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.knowledgeDocument.deleteMany();
  await prisma.user.deleteMany();

  for (const user of seedUsers) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        document: user.document,
        phone: user.phone,
        companyType: user.companyType,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt
          ? new Date(user.lastLoginAt)
          : null,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
    });
  }

  for (const document of seedKnowledgeDocuments) {
    await prisma.knowledgeDocument.create({
      data: {
        ...document,
        createdAt: new Date(document.createdAt),
        updatedAt: new Date(document.updatedAt),
      },
    });
  }

  for (const ticket of seedTickets) {
    await prisma.ticket.create({
      data: {
        id: ticket.id,
        protocol: ticket.protocol,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        status: ticket.status,
        priority: ticket.priority,
        requesterId: ticket.requesterId,
        requesterName: ticket.requesterName,
        aiSummary: ticket.aiSummary,
        resolutionNotes: ticket.resolutionNotes,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
        histories: {
          create: ticket.histories.map((history) => ({
            id: history.id,
            actorName: history.actorName,
            action: history.action,
            note: history.note,
            createdAt: new Date(history.createdAt),
          })),
        },
      },
    });
  }

  for (const conversation of seedConversations) {
    await prisma.chatConversation.create({
      data: {
        ...conversation,
        createdAt: new Date(conversation.createdAt),
        updatedAt: new Date(conversation.updatedAt),
      },
    });
  }

  for (const message of seedMessages) {
    await prisma.chatMessage.create({
      data: {
        ...message,
        citations: message.citations as unknown as Prisma.InputJsonValue | undefined,
        createdAt: new Date(message.createdAt),
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
