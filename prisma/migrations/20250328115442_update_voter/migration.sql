/*
  Warnings:

  - You are about to drop the column `name` on the `Voter` table. All the data in the column will be lost.
  - Added the required column `avatar` to the `Voter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `Voter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hashpassword` to the `Voter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `Voter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `middleName` to the `Voter` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Voter" DROP COLUMN "name",
ADD COLUMN     "avatar" TEXT NOT NULL,
ADD COLUMN     "firstName" TEXT NOT NULL,
ADD COLUMN     "hashpassword" TEXT NOT NULL,
ADD COLUMN     "lastName" TEXT NOT NULL,
ADD COLUMN     "middleName" TEXT NOT NULL;
