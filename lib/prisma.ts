import { PrismaClient } from "@prisma/client";
import { isDatabaseEnabled } from "@/lib/env";

declare global {
  var __intelixPrisma: PrismaClient | undefined;
}

export const prisma = isDatabaseEnabled
  ? global.__intelixPrisma ?? new PrismaClient()
  : null;

if (prisma && process.env.NODE_ENV !== "production") {
  global.__intelixPrisma = prisma;
}
