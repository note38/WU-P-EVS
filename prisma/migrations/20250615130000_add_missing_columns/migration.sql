-- Add missing columns to User table
ALTER TABLE "User" ADD COLUMN "clerkId" TEXT UNIQUE;
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- Add missing columns to Voter table
ALTER TABLE "Voter" ADD COLUMN "clerkId" TEXT UNIQUE;
CREATE INDEX "Voter_clerkId_idx" ON "Voter"("clerkId");