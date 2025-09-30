const { PrismaClient } = require("@prisma/client");

async function testPrismaDirect() {
  const prisma = new PrismaClient();

  try {
    console.log("Testing direct Prisma voter creation without electionId...");

    const voter = await prisma.voter.create({
      data: {
        avatar: "default-avatar.png",
        firstName: "PrismaDirect",
        lastName: "Test",
        middleName: "API",
        email: `prismadirect.test.${Date.now()}@example.com`,
        hashpassword: "", // Empty string instead of null
        yearId: 4,
        status: "UNCAST",
        // Don't include electionId to test if it's truly optional
      },
    });

    console.log("✅ Voter created successfully:", voter);
  } catch (error) {
    console.error("❌ Error creating voter:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaDirect();
