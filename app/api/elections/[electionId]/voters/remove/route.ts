import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { electionId: string } }
) {
  try {
    const electionId = parseInt(params.electionId);
    const body = await request.json();
    const { voterIds } = body;

    // Validate input
    if (!Array.isArray(voterIds) || voterIds.length === 0) {
      return NextResponse.json(
        { error: "voterIds array is required and cannot be empty" },
        { status: 400 }
      );
    }

    // Validate that all voterIds are numbers
    const validVoterIds = voterIds.filter(
      (id) => typeof id === "number" && !isNaN(id)
    );
    if (validVoterIds.length !== voterIds.length) {
      return NextResponse.json(
        { error: "All voter IDs must be valid numbers" },
        { status: 400 }
      );
    }

    // Validate that the election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Check if any of the voters have already voted in this election
    const votersWithVotes = await prisma.vote.findMany({
      where: {
        voterId: { in: validVoterIds },
        electionId: electionId,
      },
      select: {
        voterId: true,
        voter: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (votersWithVotes.length > 0) {
      const voterNames = votersWithVotes
        .map((v) => `${v.voter.firstName} ${v.voter.lastName}`)
        .join(", ");

      return NextResponse.json(
        {
          error: `Cannot remove voters who have already voted: ${voterNames}`,
        },
        { status: 400 }
      );
    }

    // Remove voters from the election by setting electionId to null
    const result = await prisma.voter.updateMany({
      where: {
        id: { in: validVoterIds },
        electionId: electionId, // Only update voters that are actually in this election
      },
      data: {
        electionId: null,
        status: "REGISTERED", // Reset status
      },
    });

    return NextResponse.json({
      message: `Successfully removed ${result.count} voter(s) from the election`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error removing voters from election:", error);
    return NextResponse.json(
      { error: "Failed to remove voters from election" },
      { status: 500 }
    );
  }
}
