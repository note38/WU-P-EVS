/*
  Warnings:

  - You are about to drop the column `credentialsSent` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `Year` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Voter" DROP CONSTRAINT "Voter_electionId_fkey";

-- DropForeignKey
ALTER TABLE "Year" DROP CONSTRAINT "Year_departmentId_fkey";

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "programId" INTEGER;

-- AlterTable
ALTER TABLE "Voter" DROP COLUMN "credentialsSent";

-- AlterTable
ALTER TABLE "Year" DROP COLUMN "departmentId",
ADD COLUMN     "programId" INTEGER;

-- CreateTable
CREATE TABLE "Program" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "departmentId" INTEGER NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Position_electionId_programId_idx" ON "Position"("electionId", "programId");

-- CreateIndex
CREATE INDEX "Voter_email_idx" ON "Voter"("email");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voter" ADD CONSTRAINT "Voter_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Year" ADD CONSTRAINT "Year_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE CASCADE ON UPDATE CASCADE;
