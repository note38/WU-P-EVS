/**
 * Debug script to check why elections are not changing to completed status
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugElectionStatus() {
  try {
    console.log("=== Election Status Debug Script ===");
    const now = new Date();
    console.log("Current time:", now.toISOString());

    // Get all elections
    const allElections = await prisma.election.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    console.log("\nAll elections:");
    allElections.forEach((election) => {
      console.log(`- ID: ${election.id}, Name: "${election.name}"`);
      console.log(`  Status: ${election.status}`);
      console.log(`  Start: ${election.startDate.toISOString()}`);
      console.log(`  End: ${election.endDate.toISOString()}`);
      console.log(`  Ended: ${now >= election.endDate ? "YES" : "NO"}`);
      console.log(
        `  Should be COMPLETED: ${election.status !== "COMPLETED" && now >= election.endDate ? "YES" : "NO"}`
      );
      console.log("---");
    });

    // Check elections that should be completed
    const electionsToComplete = allElections.filter(
      (election) => election.status !== "COMPLETED" && now >= election.endDate
    );

    console.log("\nElections that should be COMPLETED:");
    if (electionsToComplete.length === 0) {
      console.log("None found");
    } else {
      electionsToComplete.forEach((election) => {
        console.log(`- ID: ${election.id}, Name: "${election.name}"`);
      });
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error in debug script:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

debugElectionStatus();
