const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("Checking database connection...");

    // Try to query the Voter table structure
    const voters = await prisma.$queryRaw`SELECT * FROM "Voter" LIMIT 0`;
    console.log("Voter table exists and is accessible");

    // Get column information
    const columns =
      await prisma.$queryRaw`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Voter'`;
    console.log("Voter table columns:", columns);
  } catch (error) {
    console.error("Database check failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
