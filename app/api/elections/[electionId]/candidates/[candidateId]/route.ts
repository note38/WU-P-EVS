import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/elections/[electionId]/candidates/[candidateId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { electionId: string; candidateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const electionId = parseInt(params.electionId);
    const candidateId = parseInt(params.candidateId);

    if (isNaN(electionId) || isNaN(candidateId)) {
      return NextResponse.json(
        { error: "Invalid election or candidate ID" },
        { status: 400 }
      );
    }

    // Parse request body
    const { name, avatar, positionId, partylistId } = await req.json();

    // Validate required fields
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Candidate name is required" },
        { status: 400 }
      );
    }

    if (!positionId) {
      return NextResponse.json(
        { error: "Position is required" },
        { status: 400 }
      );
    }

    if (!partylistId) {
      return NextResponse.json(
        { error: "Party/Affiliation is required" },
        { status: 400 }
      );
    }

    // Check if the election exists and user has permission
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
        createdById: parseInt(session.user.id),
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Check if the candidate exists and belongs to this election
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        electionId: electionId,
      },
    });

    if (!existingCandidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Validate position exists
    const position = await prisma.position.findFirst({
      where: {
        id: parseInt(positionId),
        electionId: electionId,
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    // Validate partylist exists
    const partylist = await prisma.partylist.findFirst({
      where: {
        id: parseInt(partylistId),
        electionId: electionId,
      },
    });

    if (!partylist) {
      return NextResponse.json(
        { error: "Party/Affiliation not found" },
        { status: 404 }
      );
    }

    // Update the candidate
    const updatedCandidate = await prisma.candidate.update({
      where: { id: candidateId },
      data: {
        name: name.trim(),
        avatar: avatar || "/placeholder.svg",
        positionId: parseInt(positionId),
        partylistId: parseInt(partylistId),
      },
    });

    return NextResponse.json({
      message: "Candidate updated successfully",
      candidate: updatedCandidate,
    });
  } catch (error) {
    console.error("Error updating candidate:", error);
    return NextResponse.json(
      { error: "Failed to update candidate" },
      { status: 500 }
    );
  }
}

// DELETE /api/elections/[electionId]/candidates/[candidateId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { electionId: string; candidateId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "You must be logged in" },
        { status: 401 }
      );
    }

    const electionId = parseInt(params.electionId);
    const candidateId = parseInt(params.candidateId);

    if (isNaN(electionId) || isNaN(candidateId)) {
      return NextResponse.json(
        { error: "Invalid election or candidate ID" },
        { status: 400 }
      );
    }

    // Check if the election exists and user has permission
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
        createdById: parseInt(session.user.id),
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found or you don't have permission" },
        { status: 404 }
      );
    }

    // Check if the candidate exists and belongs to this election
    const existingCandidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        electionId: electionId,
      },
    });

    if (!existingCandidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Delete the candidate (this will cascade to delete associated votes)
    await prisma.candidate.delete({
      where: { id: candidateId },
    });

    return NextResponse.json({
      message: "Candidate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    return NextResponse.json(
      { error: "Failed to delete candidate" },
      { status: 500 }
    );
  }
}
