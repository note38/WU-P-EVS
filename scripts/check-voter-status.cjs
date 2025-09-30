const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkVoterStatus() {
  try {
    console.log("Checking VoterStatus enum values...");

    // Try to get enum values
    try {
      const result =
        await prisma.$queryRaw`SELECT enumlabel FROM pg_enum WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'VoterStatus') ORDER BY enumsortorder`;
      console.log("VoterStatus enum values:", result);
    } catch (error) {
      console.log("Error checking VoterStatus enum:", error.message);

      // Try alternative approach
      try {
        const result =
          await prisma.$queryRaw`SELECT typname, typtype FROM pg_type WHERE typname = 'VoterStatus'`;
        console.log("VoterStatus type info:", result);
      } catch (error2) {
        console.log("Error checking VoterStatus type:", error2.message);
      }
    }

    console.log("VoterStatus check completed");
  } catch (error) {
    console.error("Error checking VoterStatus:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkVoterStatus();
