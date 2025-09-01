const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  try {
    console.log("🔍 Testing database connection...");

    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Get table counts
    const adminCount = await prisma.user.count();
    const voterCount = await prisma.voter.count();

    console.log(`📊 Database stats:`);
    console.log(`   - Admin users: ${adminCount}`);
    console.log(`   - Voters: ${voterCount}`);

    // List all admin users
    const adminUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`\n👥 Admin users:`);
    adminUsers.forEach((user) => {
      console.log(
        `   - ID: ${user.id}, Email: ${user.email}, Clerk ID: ${user.clerkId || "Not linked"}, Role: ${user.role}`
      );
    });

    // List all voters
    const voters = await prisma.voter.findMany({
      select: {
        id: true,
        email: true,
        clerkId: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
      take: 10, // Limit to first 10
    });

    console.log(`\n🗳️ Voters (first 10):`);
    voters.forEach((voter) => {
      console.log(
        `   - ID: ${voter.id}, Email: ${voter.email}, Clerk ID: ${voter.clerkId || "Not linked"}, Name: ${voter.firstName} ${voter.lastName}, Role: ${voter.role}`
      );
    });

    if (voterCount > 10) {
      console.log(`   ... and ${voterCount - 10} more voters`);
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testUserLookup(email) {
  try {
    console.log(`\n🔍 Testing user lookup for email: ${email}`);

    await prisma.$connect();

    // Check admin users
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        clerkId: true,
        role: true,
        username: true,
        createdAt: true,
      },
    });

    if (adminUser) {
      console.log(`✅ Found admin user:`);
      console.log(`   - ID: ${adminUser.id}`);
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Clerk ID: ${adminUser.clerkId || "Not linked"}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Username: ${adminUser.username}`);
      console.log(`   - Created: ${adminUser.createdAt}`);
      return { type: "admin", user: adminUser };
    }

    // Check voters
    const voter = await prisma.voter.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        clerkId: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

    if (voter) {
      console.log(`✅ Found voter:`);
      console.log(`   - ID: ${voter.id}`);
      console.log(`   - Email: ${voter.email}`);
      console.log(`   - Clerk ID: ${voter.clerkId || "Not linked"}`);
      console.log(`   - Name: ${voter.firstName} ${voter.lastName}`);
      console.log(`   - Role: ${voter.role}`);
      console.log(`   - Status: ${voter.status}`);
      console.log(`   - Created: ${voter.createdAt}`);
      return { type: "voter", user: voter };
    }

    console.log(`❌ No user found with email: ${email}`);
    return null;
  } catch (error) {
    console.error("❌ User lookup failed:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Main execution
async function main() {
  console.log("🚀 Starting authentication test...\n");

  await testDatabaseConnection();

  // Test with a specific email if provided
  const testEmail = process.argv[2];
  if (testEmail) {
    await testUserLookup(testEmail);
  }

  console.log("\n✨ Test completed!");
}

main().catch(console.error);
