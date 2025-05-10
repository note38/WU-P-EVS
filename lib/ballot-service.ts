import { prisma } from "@/lib/db";
import type { Position, BallotSubmission } from "@/types/ballot";

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

    const voter = await prisma.voter.findUnique({
      where: { id: voterId },
      select: { electionId: true },
    });

    if (!voter) {
      return { success: false, error: "Voter not found" };
    }

    const selectionPromises = Object.entries(submission.selections).map(
      ([positionId, candidateId]) =>
        prisma.vote.create({
          data: {
            voterId: voterId,
            positionId: Number(positionId),
            candidateId: Number(candidateId),
            electionId: voter.electionId,
          },
        })
    );

    await Promise.all(selectionPromises);

    await prisma.voter.update({
      where: { id: voterId },
      data: { status: "VOTED" },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to submit ballot:", error);
    return { success: false, error: "Failed to submit ballot" };
  }
}
