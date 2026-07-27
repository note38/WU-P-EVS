import { validateAdminAccess } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/elections/[electionId]/candidates/[candidateId]
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ electionId: string; candidateId: string }> }
) {
  try {
    const adminValidation = await validateAdminAccess();
    if (!adminValidation.success || !adminValidation.userData) {
      return adminValidation.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userData = adminValidation.userData;

    const params = await context.params;
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

    // Check if the election exists (any admin can edit candidates)
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
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
  } catch (error: any) {
    console.error("=== ERROR UPDATING CANDIDATE ===");
    console.error("Message:", error?.message);
    console.error("Code:", error?.code);
    console.error("Meta:", error?.meta);
    console.error("Stack:", error?.stack);
    console.error("================================");
    return NextResponse.json(
      {
        error: "Failed to update candidate",
        detail: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/elections/[electionId]/candidates/[candidateId]
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ electionId: string; candidateId: string }> }
) {
  try {
    const adminValidation = await validateAdminAccess();
    if (!adminValidation.success || !adminValidation.userData) {
      return adminValidation.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userData = adminValidation.userData;

    const params = await context.params;
    const electionId = parseInt(params.electionId);
    const candidateId = parseInt(params.candidateId);

    if (isNaN(electionId) || isNaN(candidateId)) {
      return NextResponse.json(
        { error: "Invalid election or candidate ID" },
        { status: 400 }
      );
    }

    // Check if the election exists (any admin can manage candidates)
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ electionId: string; candidateId: string }> }
) {
  try {
    const adminValidation = await validateAdminAccess();
    if (!adminValidation.success || !adminValidation.userData) {
      return adminValidation.response || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userData = adminValidation.userData;

    const params = await context.params;
    const electionId = parseInt(params.electionId);
    const candidateId = parseInt(params.candidateId);

    if (isNaN(electionId) || isNaN(candidateId)) {
      return NextResponse.json(
        { error: "Invalid election or candidate ID" },
        { status: 400 }
      );
    }

    // Check if the election exists (any admin can view candidates)
    const election = await prisma.election.findFirst({
      where: {
        id: electionId,
      },
    });

    if (!election) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Get the candidate with related data
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        electionId: electionId,
      },
      include: {
        position: true,
        partylist: true,
      },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ candidate });
  } catch (error) {
    console.error("Error fetching candidate:", error);
    return NextResponse.json(
      { error: "Failed to fetch candidate" },
      { status: 500 }
    );
  }
}
