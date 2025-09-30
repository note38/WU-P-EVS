const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixSchema() {
  try {
    console.log("Attempting to add missing columns...");

    // Try to add the clerkId column to User table
    try {
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "clerkId" TEXT UNIQUE`;
      console.log("Added clerkId column to User table");
    } catch (error) {
      if (
        error.message.includes(
          'column "clerkId" of relation "User" already exists'
        )
      ) {
        console.log("clerkId column already exists in User table");
      } else {
        console.log("Error adding clerkId to User table:", error.message);
      }
    }

    // Try to add index for clerkId on User table
    try {
      await prisma.$executeRaw`CREATE INDEX "User_clerkId_idx" ON "User"("clerkId")`;
      console.log("Created index for clerkId on User table");
    } catch (error) {
      if (
        error.message.includes('relation "User_clerkId_idx" already exists')
      ) {
        console.log("Index for clerkId already exists on User table");
      } else {
        console.log(
          "Error creating index for clerkId on User table:",
          error.message
        );
      }
    }

    // Try to add the clerkId column to Voter table
    try {
      await prisma.$executeRaw`ALTER TABLE "Voter" ADD COLUMN "clerkId" TEXT UNIQUE`;
      console.log("Added clerkId column to Voter table");
    } catch (error) {
      if (
        error.message.includes(
          'column "clerkId" of relation "Voter" already exists'
        )
      ) {
        console.log("clerkId column already exists in Voter table");
      } else {
        console.log("Error adding clerkId to Voter table:", error.message);
      }
    }

    // Try to add index for clerkId on Voter table
    try {
      await prisma.$executeRaw`CREATE INDEX "Voter_clerkId_idx" ON "Voter"("clerkId")`;
      console.log("Created index for clerkId on Voter table");
    } catch (error) {
      if (
        error.message.includes('relation "Voter_clerkId_idx" already exists')
      ) {
        console.log("Index for clerkId already exists on Voter table");
      } else {
        console.log(
          "Error creating index for clerkId on Voter table:",
          error.message
        );
      }
    }

    console.log("Schema fix attempt completed");
  } catch (error) {
    console.error("Error fixing schema:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSchema();
