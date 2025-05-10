/*
  Warnings:

  - The values [DRAFT] on the enum `ElectionStatus` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `electionId` to the `Candidate` table without a default value. This is not possible if the table is not empty.
  - Made the column `password` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ElectionStatus_new" AS ENUM ('INACTIVE', 'ACTIVE', 'COMPLETED');
ALTER TABLE "Election" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Election" ALTER COLUMN "status" TYPE "ElectionStatus_new" USING ("status"::text::"ElectionStatus_new");
ALTER TYPE "ElectionStatus" RENAME TO "ElectionStatus_old";
ALTER TYPE "ElectionStatus_new" RENAME TO "ElectionStatus";
DROP TYPE "ElectionStatus_old";
ALTER TABLE "Election" ALTER COLUMN "status" SET DEFAULT 'INACTIVE';
COMMIT;

-- DropForeignKey
ALTER TABLE "Vote" DROP CONSTRAINT "Vote_candidateId_fkey";

-- DropIndex
DROP INDEX "Position_electionId_idx";

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN     "electionId" INTEGER NOT NULL,
ADD COLUMN     "yearId" INTEGER;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "image" TEXT;

-- AlterTable
ALTER TABLE "Election" ALTER COLUMN "status" SET DEFAULT 'INACTIVE';

-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "yearId" INTEGER;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'ADMIN';

-- AlterTable
ALTER TABLE "Voter" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'VOTER';

-- CreateIndex
CREATE INDEX "Candidate_electionId_idx" ON "Candidate"("electionId");

-- CreateIndex
CREATE INDEX "Candidate_yearId_idx" ON "Candidate"("yearId");

-- CreateIndex
CREATE INDEX "Position_electionId_yearId_idx" ON "Position"("electionId", "yearId");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_electionId_fkey" FOREIGN KEY ("electionId") REFERENCES "Election"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year"("id") ON DELETE SET NULL ON UPDATE CASCADE;
