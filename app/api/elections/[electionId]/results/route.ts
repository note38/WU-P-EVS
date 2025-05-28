import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, context: any) {
  try {
    const params = await context.params;
    const electionId = parseInt(params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID format" },
        { status: 400 }
      );
    }

    // Get election details with all related data
    const election = await prisma.election.findUnique({
      where: { id: electionId },
      include: {
        positions: {
          include: {
            candidates: {
              include: {
                partylist: true,
              },
            },
          },
        },
        _count: {
          select: {
            positions: true,
            candidates: true,
            voters: true,
            votes: true,
          },
        },
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Get vote counts for each candidate
    const voteCounts = await prisma.vote.groupBy({
      by: ["candidateId"],
      where: {
        electionId: electionId,
      },
      _count: {
        candidateId: true,
      },
    });

    // Create a map of candidate ID to vote count
    const voteCountMap = voteCounts.reduce(
      (acc, vote) => {
        acc[vote.candidateId] = vote._count.candidateId;
        return acc;
      },
      {} as Record<number, number>
    );

    // Get voter statistics
    const voterStats = await prisma.voter.groupBy({
      by: ["status"],
      where: {
        electionId: electionId,
      },
      _count: {
        status: true,
      },
    });

    const votedCount =
      voterStats.find((stat) => stat.status === "VOTED")?._count.status || 0;
    const registeredCount =
      voterStats.find((stat) => stat.status === "REGISTERED")?._count.status ||
      0;

    // Format positions with candidates and their vote counts
    const formattedPositions = election.positions.map((position) => {
      const candidates = position.candidates.map((candidate) => ({
        id: candidate.id,
        name: candidate.name,
        avatar: candidate.avatar,
        partylist: candidate.partylist.name,
        votes: voteCountMap[candidate.id] || 0,
      }));

      // Sort candidates by vote count (descending)
      candidates.sort((a, b) => b.votes - a.votes);

      return {
        id: position.id,
        name: position.name,
        maxCandidates: position.maxCandidates,
        candidates,
        totalVotes: candidates.reduce(
          (sum, candidate) => sum + candidate.votes,
          0
        ),
      };
    });

    // Format election details
    const electionDetails = {
      id: election.id,
      name: election.name,
      description: election.description,
      startDate: election.startDate,
      endDate: election.endDate,
      status: election.status,
      positions: election._count.positions,
      candidates: election._count.candidates,
      voters: election._count.voters,
      castedVotes: votedCount,
      uncastedVotes: registeredCount,
    };

    return NextResponse.json({
      election: electionDetails,
      positions: formattedPositions,
    });
  } catch (error) {
    console.error("Error fetching election results:", error);
    return NextResponse.json(
      { error: "Failed to fetch election results" },
      { status: 500 }
    );
  }
}
