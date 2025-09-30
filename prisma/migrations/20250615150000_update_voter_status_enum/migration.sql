-- Update VoterStatus enum values to match Prisma schema
ALTER TYPE "VoterStatus" RENAME VALUE 'REGISTERED' TO 'UNCAST';
ALTER TYPE "VoterStatus" RENAME VALUE 'VOTED' TO 'CAST';