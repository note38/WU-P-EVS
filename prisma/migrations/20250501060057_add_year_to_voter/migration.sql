/*
  Warnings:

  - The values [ARCHIVED] on the enum `ElectionStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [CANDIDATE] on the enum `Role` will be removed. If these variants are still used in the database, this will fail.
  - The values [INVALIDATED] on the enum `VoterStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `departmentId` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `pollingStation` on the `Voter` table. All the data in the column will be lost.
  - You are about to drop the column `voterId` on the `Voter` table. All the data in the column will be lost.
  - Added the required column `yearId` to the `Voter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ElectionStatus_new" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED');
ALTER TABLE "Election" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Election" ALTER COLUMN "status" TYPE "ElectionStatus_new" USING ("status"::text::"ElectionStatus_new");
ALTER TYPE "ElectionStatus" RENAME TO "ElectionStatus_old";
ALTER TYPE "ElectionStatus_new" RENAME TO "ElectionStatus";
DROP TYPE "ElectionStatus_old";
ALTER TABLE "Election" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('ADMIN', 'VOTER');
ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'VOTER';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "VoterStatus_new" AS ENUM ('REGISTERED', 'VOTED');
ALTER TABLE "Voter" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Voter" ALTER COLUMN "status" TYPE "VoterStatus_new" USING ("status"::text::"VoterStatus_new");
ALTER TYPE "VoterStatus" RENAME TO "VoterStatus_old";
ALTER TYPE "VoterStatus_new" RENAME TO "VoterStatus";
DROP TYPE "VoterStatus_old";
ALTER TABLE "Voter" ALTER COLUMN "status" SET DEFAULT 'REGISTERED';
COMMIT;

-- DropForeignKey
ALTER TABLE "Voter" DROP CONSTRAINT "Voter_departmentId_fkey";

-- DropIndex
DROP INDEX "Voter_electionId_departmentId_idx";

-- DropIndex
DROP INDEX "Voter_voterId_key";

-- AlterTable
ALTER TABLE "Voter" DROP COLUMN "departmentId",
DROP COLUMN "pollingStation",
DROP COLUMN "voterId",
ADD COLUMN     "yearId" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Voter_electionId_yearId_idx" ON "Voter"("electionId", "yearId");

-- AddForeignKey
ALTER TABLE "Voter" ADD CONSTRAINT "Voter_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "Year"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
