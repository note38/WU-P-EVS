import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ electionId: string }> }
) {
  try {
    const { electionId: electionIdStr } = await params;
    const electionId = parseInt(electionIdStr);
    const body = await request.json();
    const { departmentId } = body;

    if (!departmentId) {
      return NextResponse.json({ error: "departmentId is required" }, { status: 400 });
    }

    // Validate election exists
    const election = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!election) {
      return NextResponse.json({ error: "Election not found" }, { status: 404 });
    }

    // Find all voters in this election that belong to the specified department
    const votersToRemove = await prisma.voter.findMany({
      where: {
        electionId: electionId,
        year: {
          program: {
            departmentId: parseInt(departmentId),
          },
        },
      },
      select: {
        id: true,
      },
    });

    if (votersToRemove.length === 0) {
      return NextResponse.json(
        { error: "No voters found in this department for this election" },
        { status: 404 }
      );
    }

    const voterIds = votersToRemove.map(v => v.id);

    // Check if any of these voters have already voted
    const votersWithVotes = await prisma.vote.findMany({
      where: {
        voterId: { in: voterIds },
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
          error: `Cannot remove department because some voters have already voted: ${voterNames}`,
        },
        { status: 400 }
      );
    }

    // Remove voters
    const result = await prisma.voter.updateMany({
      where: {
        id: { in: voterIds },
      },
      data: {
        electionId: null,
        status: "UNCAST",
      },
    });

    return NextResponse.json({
      message: `Successfully removed ${result.count} voter(s) from the election`,
      count: result.count,
    });
  } catch (error) {
    console.error("Error removing voters by department:", error);
    return NextResponse.json(
      { error: "Failed to remove voters by department" },
      { status: 500 }
    );
  }
}
