import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid election ID" },
        { status: 400 }
      );
    }

    // Use Prisma Accelerate with caching for optimized performance
    const election = await prisma.election.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        _count: {
          select: {
            voters: true,
            votes: true,
          },
        },
        positions: {
          select: {
            _count: {
              select: {
                candidates: true,
              },
            },
          },
        },
      },
      cacheStrategy: {
        ttl: 30, // Cache for 30 seconds
        swr: 60, // Stale-while-revalidate for 60 seconds
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Count total candidates across all positions
    const totalCandidates = election.positions.reduce(
      (sum, position) => sum + position._count.candidates,
      0
    );

    // Format the response
    const formattedElection = {
      id: election.id,
      name: election.name,
      description: election.description,
      startDate: election.startDate.toISOString(),
      endDate: election.endDate.toISOString(),
      status: election.status,
      candidates: totalCandidates,
      voters: election._count.voters,
      castVotes: election._count.votes,
      uncastVotes: election._count.voters - election._count.votes,
    };

    return NextResponse.json(formattedElection);
  } catch (error) {
    console.error("Error fetching election:", error);
    return NextResponse.json(
      { error: "Failed to fetch election" },
      { status: 500 }
    );
  }
}
