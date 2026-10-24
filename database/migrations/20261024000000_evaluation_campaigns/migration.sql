-- Preserve historical answers and allow one answer per user in each round.
ALTER TABLE "User"
  ADD COLUMN "feedbackCampaign" INTEGER NOT NULL DEFAULT 1;

ALTER TABLE "ProductEvaluationResponse"
  ADD COLUMN "campaign" INTEGER NOT NULL DEFAULT 1;

DROP INDEX IF EXISTS "ProductEvaluationResponse_userId_key";

CREATE UNIQUE INDEX "ProductEvaluationResponse_userId_campaign_key"
  ON "ProductEvaluationResponse"("userId", "campaign");

-- Start a new round only for the two requested accounts.
UPDATE "User"
SET "feedbackCampaign" = 2
WHERE "email" IN (
  'andres.canova@microsys.inf.br',
  'mariacecilia@microsys.inf.br'
);
