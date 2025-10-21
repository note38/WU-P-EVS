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
        middleName:
          data.middleName !== undefined
            ? String(data.middleName).trim()
            : undefined,
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

// Add POST method for deleting multiple voters
export async function POST(
  request: Request,
  { params }: { params: { voterId: string } }
) {
  // Check if this is the bulk delete endpoint
  if (params.voterId !== "bulk-delete") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { voterIds } = await request.json();

    if (!Array.isArray(voterIds) || voterIds.length === 0) {
      return NextResponse.json({ error: "Invalid voter IDs" }, { status: 400 });
    }

    // Validate that all IDs are numbers
    const validVoterIds = voterIds
      .map((id) => parseInt(id))
      .filter((id) => !isNaN(id));

    if (validVoterIds.length !== voterIds.length) {
      return NextResponse.json({ error: "Invalid voter IDs" }, { status: 400 });
    }

    // Delete multiple voters
    await prisma.voter.deleteMany({
      where: {
        id: {
          in: validVoterIds,
        },
      },
    });

    return NextResponse.json(
      { message: `${validVoterIds.length} voter(s) deleted successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting voters:", error);
    return NextResponse.json(
      {
        error: "Failed to delete voters",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
