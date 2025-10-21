/**
 * Script to test database queries for election status updates
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDbQuery() {
  try {
    console.log("=== Testing Database Query for Election Status Updates ===");

    const now = new Date();
    console.log("Current time:", now.toISOString());

    // Test the exact query used in the cron job
    console.log("\n--- Testing Cron Job Query ---");
    const cronQueryResult = await prisma.election.findMany({
      where: {
        OR: [
          // Elections that should be ACTIVE (current time is between start and end, and status is INACTIVE)
          {
            status: "INACTIVE",
            startDate: { lte: now },
            endDate: { gt: now },
          },
          // Elections that should be COMPLETED (current time is past end date, and status is not COMPLETED)
          {
            status: { not: "COMPLETED" },
            endDate: { lte: now },
          },
        ],
      },
    });

    console.log(
      "Cron job query found",
      cronQueryResult.length,
      "elections needing updates"
    );
    cronQueryResult.forEach((election) => {
      console.log(
        `- ID: ${election.id}, Name: "${election.name}", Status: ${election.status}`
      );
      console.log(`  Start: ${election.startDate.toISOString()}`);
      console.log(`  End: ${election.endDate.toISOString()}`);
      console.log(`  Now >= End: ${now >= election.endDate}`);
    });

    // Test the exact query used in the auto-status endpoint
    console.log("\n--- Testing Auto-Status Endpoint Query ---");
    const autoStatusQueryResult = await prisma.election.findMany({
      where: {
        OR: [
          {
            status: "INACTIVE",
            startDate: { lte: now },
            endDate: { gt: now },
          },
          {
            status: "ACTIVE",
            endDate: { lte: now },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    console.log(
      "Auto-status query found",
      autoStatusQueryResult.length,
      "elections needing updates"
    );
    autoStatusQueryResult.forEach((election) => {
      console.log(
        `- ID: ${election.id}, Name: "${election.name}", Status: ${election.status}`
      );
      console.log(`  Start: ${election.startDate.toISOString()}`);
      console.log(`  End: ${election.endDate.toISOString()}`);
      console.log(`  Now >= End: ${now >= election.endDate}`);
    });

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error in database query test:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

testDbQuery();
