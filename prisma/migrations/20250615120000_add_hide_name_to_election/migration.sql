-- Add hideName column to Election table
ALTER TABLE "Election" ADD COLUMN "hideName" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Election_hideName_idx" ON "Election"("hideName");