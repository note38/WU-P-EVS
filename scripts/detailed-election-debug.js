/**
 * Detailed debug script to check election date comparisons and timezone issues
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function detailedElectionDebug() {
  try {
    console.log("=== Detailed Election Debug Script ===");

    // Get current time in different formats
    const now = new Date();
    console.log("Current time (local):", now.toString());
    console.log("Current time (UTC):", now.toISOString());
    console.log("Current time (timestamp):", now.getTime());

    // Get timezone info
    console.log("Timezone offset (minutes):", now.getTimezoneOffset());
    console.log("Timezone offset (hours):", now.getTimezoneOffset() / 60);

    // Get all elections with full details
    const allElections = await prisma.election.findMany();

    console.log("\n=== Election Analysis ===");
    for (const election of allElections) {
      console.log(`\nElection ID: ${election.id}`);
      console.log(`Name: "${election.name}"`);
      console.log(`Status: ${election.status}`);

      // Log dates
      console.log(`Start Date (stored): ${election.startDate.toISOString()}`);
      console.log(`End Date (stored): ${election.endDate.toISOString()}`);

      // Convert to local time for comparison
      const startLocal = new Date(election.startDate);
      const endLocal = new Date(election.endDate);

      console.log(`Start Date (local): ${startLocal.toString()}`);
      console.log(`End Date (local): ${endLocal.toString()}`);

      // Check comparisons
      const nowAfterEnd = now >= endLocal;
      const shouldComplete = election.status !== "COMPLETED" && nowAfterEnd;

      console.log(`Now >= End Date: ${nowAfterEnd}`);
      console.log(`Should be COMPLETED: ${shouldComplete}`);

      if (shouldComplete) {
        console.log(`>>> This election SHOULD BE COMPLETED! <<<`);
      }

      // Show time difference
      const timeDiff = endLocal.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      console.log(`Time until end (hours): ${hoursDiff.toFixed(2)}`);
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error in detailed debug script:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

detailedElectionDebug();
