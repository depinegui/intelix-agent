CREATE TYPE "KnowledgeDocumentOrigin" AS ENUM ('MANUAL', 'UPLOAD', 'LEGACY_IMPORT');
CREATE TYPE "KnowledgeProcessingStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'ERROR');

ALTER TABLE "KnowledgeDocument"
  ADD COLUMN "origin" "KnowledgeDocumentOrigin" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "processingStatus" "KnowledgeProcessingStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "processingError" TEXT,
  ADD COLUMN "processedAt" TIMESTAMP(3),
  ADD COLUMN "sourceKey" TEXT,
  ADD COLUMN "contentHash" TEXT,
  ADD COLUMN "fileName" TEXT,
  ADD COLUMN "mimeType" TEXT,
  ADD COLUMN "fileSize" INTEGER,
  ADD COLUMN "fileData" BYTEA,
  ADD COLUMN "uploadedById" TEXT;

CREATE UNIQUE INDEX "KnowledgeDocument_sourceKey_key" ON "KnowledgeDocument"("sourceKey");
CREATE INDEX "KnowledgeDocument_processingStatus_updatedAt_idx" ON "KnowledgeDocument"("processingStatus", "updatedAt");
CREATE INDEX "KnowledgeDocument_origin_updatedAt_idx" ON "KnowledgeDocument"("origin", "updatedAt");

ALTER TABLE "KnowledgeDocument"
  ADD CONSTRAINT "KnowledgeDocument_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "KnowledgeChunk" (
  "id" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "excerpt" TEXT NOT NULL,
  "searchText" TEXT NOT NULL,
  "embedding" JSONB,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "KnowledgeChunk_documentId_chunkIndex_key" ON "KnowledgeChunk"("documentId", "chunkIndex");
CREATE INDEX "KnowledgeChunk_documentId_idx" ON "KnowledgeChunk"("documentId");

ALTER TABLE "KnowledgeChunk"
  ADD CONSTRAINT "KnowledgeChunk_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
