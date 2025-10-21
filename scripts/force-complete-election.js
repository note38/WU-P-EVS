/**
 * Script to force complete a specific election by ID
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function forceCompleteElection() {
  try {
    console.log("=== Force Completing Election ===");

    // Election ID 7 is the one that should be completed
    const electionId = 7;

    console.log(`Looking for election with ID: ${electionId}`);

    // First, get the election to verify it exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      console.log(`Election with ID ${electionId} not found`);
      await prisma.$disconnect();
      return;
    }

    console.log(`Found election: "${election.name}"`);
    console.log(`Current status: ${election.status}`);
    console.log(`End date: ${election.endDate.toISOString()}`);

    const now = new Date();
    console.log(`Current time: ${now.toISOString()}`);

    if (now >= election.endDate) {
      console.log("Election should be completed. Updating status...");

      // Update the election status to COMPLETED
      const updatedElection = await prisma.election.update({
        where: { id: electionId },
        data: {
          status: "COMPLETED",
          updatedAt: now,
        },
      });

      console.log(
        `✅ Successfully updated election status to: ${updatedElection.status}`
      );
    } else {
      console.log("Election end date has not passed yet");
    }

    await prisma.$disconnect();
  } catch (error) {
    console.error("Error in force complete script:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

forceCompleteElection();
