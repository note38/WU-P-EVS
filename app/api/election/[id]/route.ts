// app/api/elections/get-election/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Election ID is required" },
        { status: 400 }
      );
    }

    const electionId = parseInt(id);

    // Fetch the election with related counts
    const election = await prisma.election.findUnique({
      where: {
        id: electionId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        status: true,
        _count: {
          select: {
            positions: true,
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
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Calculate totals
    const candidatesCount = election.positions.reduce(
      (total, position) => total + position._count.candidates,
      0
    );

    const votersCount = election._count.voters;
    const castVotesCount = election._count.votes;
    const uncastVotesCount = votersCount - castVotesCount;

    // Format the response
    const formattedElection = {
      id: election.id,
      name: election.name,
      description: election.description,
      startDate: election.startDate.toISOString(),
      endDate: election.endDate.toISOString(),
      status: election.status,
      candidatesCount,
      votersCount,
      castVotesCount,
      uncastVotesCount,
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
