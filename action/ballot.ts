"use server";

import { prisma } from "@/lib/db";
import { getVoterSession } from "./auth";
import { redirect } from "next/navigation";

export async function submitBallot(selections: Record<string, string>) {
  const voterSession = await getVoterSession();

  if (!voterSession) {
    return {
      success: false,
      message: "You must be logged in to submit a ballot",
    };
  }

  const voterId = Number(voterSession.id);
  const electionId = Number(voterSession.electionId);

  try {
    // Start a transaction
    return await prisma.$transaction(async (tx) => {
      // Check if voter has already voted
      const voter = await tx.voter.findUnique({
        where: { id: voterId },
        include: { election: true },
      });

      if (!voter) {
        return { success: false, message: "Voter not found" };
      }

      if (voter.status === "VOTED") {
        return {
          success: false,
          message: "You have already voted in this election",
        };
      }

      if (!voter.election) {
        return {
          success: false,
          message: "Voter is not associated with an active election",
        };
      }

      if (voter.election.status !== "ACTIVE") {
        return {
          success: false,
          message: "This election is not currently active",
        };
      }

      // Get positions for this election
      const positions = await tx.position.findMany({
        where: { electionId: electionId },
      });

      // Validate that all positions have a selection
      const positionIds = positions.map((p) => String(p.id));
      const selectedPositions = Object.keys(selections);

      const missingPositions = positionIds.filter(
        (id) => !selectedPositions.includes(id)
      );

      if (missingPositions.length > 0) {
        return { success: false, message: "You must vote for all positions" };
      }

      // Create vote records
      const votePromises = Object.entries(selections).map(
        ([positionId, candidateId]) => {
          return tx.vote.create({
            data: {
              voterId: voterId,
              candidateId: Number(candidateId),
              positionId: Number(positionId),
              electionId: electionId,
            },
          });
        }
      );

      await Promise.all(votePromises);

      // Update voter status to CAST
      await tx.voter.update({
        where: { id: voterId },
        data: { status: "CAST" },
      });

      return { success: true };
    });
  } catch (error) {
    console.error("Ballot submission error:", error);
    return {
      success: false,
      message: "An error occurred while submitting your ballot",
    };
  }
}

export async function requireVoterSession() {
  const session = await getVoterSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
