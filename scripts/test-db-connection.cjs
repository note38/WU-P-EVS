const { PrismaClient } = require("@prisma/client");

async function testDbConnection() {
  const prisma = new PrismaClient();

  try {
    console.log("Testing database connection...");
    // Try a simple query
    const voters = await prisma.voter.findMany({
      take: 1,
    });
    console.log("Database connection successful!");
    console.log("Sample voter:", voters[0]);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDbConnection();
