import { prisma } from "@/lib/db";
import type { Position, BallotSubmission } from "@/types/ballot";
import { VoterStatus } from "@prisma/client";

export async function getPositionsWithCandidates(
  electionId?: number,
  hideNames: boolean = false
): Promise<Position[]> {
  try {
    // If no electionId provided, fetch all positions (backward compatibility)
    if (!electionId) {
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
          // ✅ SECURITY FIX: Respect hideNames setting
          name: hideNames ? "Candidate" : candidate.name,
          party: hideNames ? "" : String(candidate.partylistId),
          avatar: candidate.avatar || undefined,
        })),
      }));
    }

    // If electionId provided, fetch only positions for that election
    const positions = await prisma.position.findMany({
      where: {
        electionId: electionId,
      },
      include: {
        candidates: {
          include: {
            partylist: true,
          },
        },
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
        // ✅ SECURITY FIX: Respect hideNames setting
        name: hideNames ? "Candidate" : candidate.name,
        party: hideNames ? "" : (candidate.partylist?.name || "Independent"),
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

    // Log for debugging
    console.log("Submitting ballot for voter ID:", voterId);
    console.log("Submission data:", submission);

    // Use a transaction to ensure data consistency
    return await prisma.$transaction(async (tx) => {
      // Check if voter exists and hasn't voted yet
      console.log(`Looking up voter with ID ${voterId}`);
      const voter = await tx.voter.findUnique({
        where: { id: voterId },
        select: {
          id: true,
          electionId: true,
          status: true,
        },
      });

      console.log(`Voter lookup result:`, voter);

      if (!voter) {
        console.error(`Voter with ID ${voterId} not found in database`);
        return { success: false, error: `Voter with ID ${voterId} not found` };
      }

      if (!voter.electionId) {
        return {
          success: false,
          error: "Voter is not assigned to an election",
        };
      }

      if (voter.status === VoterStatus.CAST) {
        return { success: false, error: "Voter has already voted" };
      }

      const electionId = Number(voter.electionId);

      // Validate all positions and candidates before creating votes
      console.log(
        `Validating ${Object.keys(submission.selections).length} selections for election ${electionId}`
      );
      for (const [positionId, candidateValue] of Object.entries(
        submission.selections
      )) {
        if (candidateValue === "skip" || !candidateValue) {
          console.log(`Skipping validation for position ${positionId} because voter preferred not to vote`);
          continue;
        }

        const posId = Number(positionId);
        const candidateIds: number[] = (
          Array.isArray(candidateValue)
            ? candidateValue
            : typeof candidateValue === "string"
              ? candidateValue.split(",")
              : []
        )
          .map((id) => Number(id))
          .filter((id) => !isNaN(id) && id > 0);

        console.log(`Validating position ${posId} and candidates ${candidateIds.join(", ")}`);

        // Check if position exists and belongs to this election
        const position = await tx.position.findUnique({
          where: {
            id: posId,
            electionId: electionId,
          },
        });

        if (!position) {
          console.error(
            `Position ${posId} not found for election ${electionId}`
          );
          const allPositions = await tx.position.findMany({
            where: {
              electionId: electionId,
            },
            select: {
              id: true,
              name: true,
            },
          });
          return {
            success: false,
            error: `Invalid position ID: ${positionId}. Available positions: ${allPositions.map((p) => p.id).join(", ")}`,
          };
        }

        if (candidateIds.length > position.maxCandidates) {
          return {
            success: false,
            error: `You cannot select more than ${position.maxCandidates} candidate(s) for position ${position.name}`,
          };
        }

        // Check if each candidate exists and belongs to this position and election
        for (const candId of candidateIds) {
          const candidate = await tx.candidate.findUnique({
            where: {
              id: candId,
              positionId: posId,
              electionId: electionId,
            },
          });

          if (!candidate) {
            console.error(
              `Candidate ${candId} not found for position ${posId} in election ${electionId}`
            );
            return {
              success: false,
              error: `Invalid candidate ID: ${candId} for position ${positionId}`,
            };
          }
        }

        console.log(
          `Validation passed for position ${posId} and candidates ${candidateIds.join(", ")}`
        );
      }

      // Create all votes within the transaction
      const votesToCreate: {
        voterId: number;
        positionId: number;
        candidateId: number;
        electionId: number;
      }[] = [];

      for (const [positionId, candidateValue] of Object.entries(
        submission.selections
      )) {
        if (candidateValue === "skip" || !candidateValue) continue;

        const posId = Number(positionId);
        const candidateIds: number[] = (
          Array.isArray(candidateValue)
            ? candidateValue
            : typeof candidateValue === "string"
              ? candidateValue.split(",")
              : []
        )
          .map((id) => Number(id))
          .filter((id) => !isNaN(id) && id > 0);

        for (const candId of candidateIds) {
          votesToCreate.push({
            voterId,
            positionId: posId,
            candidateId: candId,
            electionId,
          });
        }
      }

      await Promise.all(
        votesToCreate.map((voteData) =>
          tx.vote.create({
            data: voteData,
          })
        )
      );

      // Update voter status within the same transaction
      await tx.voter.update({
        where: { id: voterId },
        data: { status: VoterStatus.CAST },
      });

      return { success: true };
    });
  } catch (error) {
    console.error("Failed to submit ballot:", error);
    return { success: false, error: "Failed to submit ballot" };
  }
}
