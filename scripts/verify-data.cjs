const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log("Verifying restored data...");

    // Check users
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach((user) => {
      console.log(`  - ${user.username} (${user.email})`);
    });

    // Check elections
    const elections = await prisma.election.findMany();
    console.log(`Found ${elections.length} elections:`);
    elections.forEach((election) => {
      console.log(`  - ${election.name} (Hide Name: ${election.hideName})`);
    });

    // Check voters
    const voters = await prisma.voter.findMany();
    console.log(`Found ${voters.length} voters:`);
    voters.forEach((voter) => {
      console.log(`  - ${voter.firstName} ${voter.lastName} (${voter.email})`);
    });

    // Check departments
    const departments = await prisma.department.findMany();
    console.log(`Found ${departments.length} departments:`);
    departments.forEach((dept) => {
      console.log(`  - ${dept.name}`);
    });

    console.log("Data verification completed successfully!");
  } catch (error) {
    console.error("Error verifying data:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();
