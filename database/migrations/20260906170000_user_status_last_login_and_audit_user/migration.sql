-- Preserve existing user records while introducing account lifecycle fields.
ALTER TABLE "User"
  ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "lastLoginAt" TIMESTAMP(3);

-- Audit events related to accounts must not be represented as chat messages.
ALTER TYPE "AuditEntityType" ADD VALUE 'USER';
