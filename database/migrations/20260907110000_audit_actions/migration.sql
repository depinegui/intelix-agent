-- Adds semantic actions without modifying existing audit records.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'LOGIN';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'UPLOAD';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'PROCESS';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ESCALATE';
