import { prisma } from "@/lib/db";
import type { Position, BallotSubmission } from "@/types/ballot";
import { VoterStatus } from "@prisma/client";

export async function getPositionsWithCandidates(): Promise<Position[]> {
  try {
    const positions = await prisma.position.findMany({
      include: {
        candidates: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    return positions.map((position) => ({
      id: String(position.id),
      title: position.name,
      candidates: position.candidates.map((candidate) => ({
        id: String(candidate.id),
        name: candidate.name,
        party: String(candidate.partylistId),
        avatar: candidate.avatar || undefined,
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch positions:", error);
    return [];
  }
}

export async function submitBallot(submission: BallotSubmission) {
  try {
    const voterId = Number(submission.voterId);

    // Use a transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Check if voter exists and hasn't voted yet
      const voter = await tx.voter.findUnique({
        where: { id: voterId },
        select: {
          id: true,
          electionId: true,
          status: true,
        },
      });

      if (!voter) {
        return { success: false, error: "Voter not found" };
      }

      if (!voter.electionId) {
        return {
          success: false,
          error: "Voter is not assigned to an election",
        };
      }

      if (voter.status === VoterStatus.VOTED) {
        return { success: false, error: "Voter has already voted" };
      }

      const electionId = Number(voter.electionId);

      // Create all votes within the transaction
      await Promise.all(
        Object.entries(submission.selections).map(([positionId, candidateId]) =>
          tx.vote.create({
            data: {
              voterId,
              positionId: Number(positionId),
              candidateId: Number(candidateId),
              electionId,
            },
          })
        )
      );

      // Update voter status within the same transaction
      await tx.voter.update({
        where: { id: voterId },
        data: { status: VoterStatus.VOTED },
      });

      return { success: true };
    });
  } catch (error) {
    console.error("Failed to submit ballot:", error);
    return { success: false, error: "Failed to submit ballot" };
  }
}
