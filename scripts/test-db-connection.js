const { PrismaClient } = require("@prisma/client");

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...");

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL environment variable is not set");
    return;
  }

  console.log("✅ DATABASE_URL is set");

  try {
    const prisma = new PrismaClient();

    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database query successful:", result);

    // Get table counts
    try {
      const adminCount = await prisma.user.count();
      const voterCount = await prisma.voter.count();
      const electionCount = await prisma.election.count();
      const voteCount = await prisma.vote.count();

      console.log(`📊 Database stats:`);
      console.log(`   - Admin users: ${adminCount}`);
      console.log(`   - Voters: ${voterCount}`);
      console.log(`   - Elections: ${electionCount}`);
      console.log(`   - Votes: ${voteCount}`);
    } catch (countError) {
      console.error("❌ Error getting table counts:", countError.message);
    }

    await prisma.$disconnect();
    console.log("✅ Database test completed successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.error("Error details:", error);
  }
}

testDatabaseConnection().catch(console.error);
