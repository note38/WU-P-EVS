import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(
  request: Request,
  { params }: { params: { voterId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voterId = parseInt(params.voterId);

    if (isNaN(voterId)) {
      return NextResponse.json({ error: "Invalid voter ID" }, { status: 400 });
    }

    // Check if voter exists
    const existingVoter = await prisma.voter.findUnique({
      where: { id: voterId },
    });

    if (!existingVoter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Delete the voter
    await prisma.voter.delete({
      where: { id: voterId },
    });

    return NextResponse.json(
      { message: "Voter deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting voter:", error);
    return NextResponse.json(
      {
        error: "Failed to delete voter",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Add PUT method for updating voters
export async function PUT(
  request: Request,
  { params }: { params: { voterId: string } }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const voterId = parseInt(params.voterId);

    if (isNaN(voterId)) {
      return NextResponse.json({ error: "Invalid voter ID" }, { status: 400 });
    }

    const data = await request.json();

    // Check if voter exists
    const existingVoter = await prisma.voter.findUnique({
      where: { id: voterId },
    });

    if (!existingVoter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.email || !data.yearId) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            firstName: !data.firstName,
            lastName: !data.lastName,
            email: !data.email,
            yearId: !data.yearId,
          },
        },
        { status: 400 }
      );
    }

    // Check if email is already used by another voter
    const existingVoterWithEmail = await prisma.voter.findUnique({
      where: {
        email: data.email,
        NOT: { id: voterId },
      },
    });

    if (existingVoterWithEmail) {
      return NextResponse.json(
        { error: "Email already registered to another voter" },
        { status: 409 }
      );
    }

    // Update the voter
    const updatedVoter = await prisma.voter.update({
      where: { id: voterId },
      data: {
        firstName: String(data.firstName).trim(),
        lastName: String(data.lastName).trim(),
        middleName: data.middleName ? String(data.middleName).trim() : "",
        email: String(data.email).trim(),
        yearId: parseInt(data.yearId),
        ...(data.electionId ? { electionId: parseInt(data.electionId) } : {}),
      },
      include: {
        year: {
          include: {
            department: true,
          },
        },
        election: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Voter updated successfully",
      voter: updatedVoter,
    });
  } catch (error) {
    console.error("Error updating voter:", error);
    return NextResponse.json(
      {
        error: "Failed to update voter",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
