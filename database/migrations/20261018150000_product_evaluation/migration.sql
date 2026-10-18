-- The evaluation is enabled only for the existing Microsys test group.
ALTER TABLE "User" ADD COLUMN "feedbackEligible" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "ProductEvaluationResponse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "easeOfUse" INTEGER NOT NULL,
    "relevance" INTEGER NOT NULL,
    "responseTime" INTEGER NOT NULL,
    "reuseIntent" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductEvaluationResponse_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductEvaluationResponse_userId_key" ON "ProductEvaluationResponse"("userId");
CREATE INDEX "ProductEvaluationResponse_createdAt_idx" ON "ProductEvaluationResponse"("createdAt");

ALTER TABLE "ProductEvaluationResponse"
  ADD CONSTRAINT "ProductEvaluationResponse_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductEvaluationResponse"
  ADD CONSTRAINT "ProductEvaluationResponse_easeOfUse_check" CHECK ("easeOfUse" BETWEEN 1 AND 5),
  ADD CONSTRAINT "ProductEvaluationResponse_relevance_check" CHECK ("relevance" BETWEEN 1 AND 5),
  ADD CONSTRAINT "ProductEvaluationResponse_responseTime_check" CHECK ("responseTime" BETWEEN 1 AND 5),
  ADD CONSTRAINT "ProductEvaluationResponse_reuseIntent_check" CHECK ("reuseIntent" BETWEEN 1 AND 5);

UPDATE "User"
SET "feedbackEligible" = true
WHERE "isActive" = true
  AND "email" IN (
    'mariacecilia@microsys.inf.br',
    'julio.sobirai@microsys.inf.br',
    'annaely.figueiredo@microsys.inf.br',
    'andres.canova@microsys.inf.br',
    'jean.bariviera@microsys.inf.br',
    'lucas.rayzer@microsys.inf.br',
    'pedro.sansigolo@microsys.inf.br',
    'vinicius.wille@microsys.inf.br'
  );
