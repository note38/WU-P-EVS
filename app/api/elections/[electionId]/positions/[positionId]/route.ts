// app/api/elections/[electionId]/positions/[positionId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/elections/[electionId]/positions/[positionId]
export async function GET(
  req: NextRequest,
  { params }: { params: { electionId: string; positionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const electionId = parseInt(params.electionId);
    const positionId = parseInt(params.positionId);

    const position = await prisma.position.findUnique({
      where: {
        id: positionId,
        electionId,
      },
      include: {
        _count: {
          select: { candidates: true },
        },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    // Format the response
    const formattedPosition = {
      id: position.id,
      name: position.name,
      maxCandidates: position.maxCandidates,
      candidates: position._count.candidates,
      yearId: position.yearId,
    };

    return NextResponse.json(formattedPosition);
  } catch (error) {
    console.error("Error fetching position:", error);
    return NextResponse.json(
      { error: "Failed to fetch position" },
      { status: 500 }
    );
  }
}

// PUT /api/elections/[electionId]/positions/[positionId]
export async function PUT(
  req: NextRequest,
  { params }: { params: { electionId: string; positionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const electionId = parseInt(params.electionId);
    const positionId = parseInt(params.positionId);
    const { name, maxCandidates, yearId } = await req.json();

    // Validate input
    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Position name is required" },
        { status: 400 }
      );
    }

    if (!maxCandidates || maxCandidates < 1) {
      return NextResponse.json(
        { error: "Maximum candidates must be at least 1" },
        { status: 400 }
      );
    }

    // Check if position exists
    const existingPosition = await prisma.position.findUnique({
      where: {
        id: positionId,
        electionId,
      },
    });

    if (!existingPosition) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    // Update the position
    const updatedPosition = await prisma.position.update({
      where: {
        id: positionId,
      },
      data: {
        name,
        maxCandidates,
        yearId: yearId || null, // Make yearId optional
      },
    });

    return NextResponse.json(updatedPosition);
  } catch (error) {
    console.error("Error updating position:", error);
    return NextResponse.json(
      { error: "Failed to update position" },
      { status: 500 }
    );
  }
}

// DELETE /api/elections/[electionId]/positions/[positionId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: { electionId: string; positionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const electionId = parseInt(params.electionId);
    const positionId = parseInt(params.positionId);

    // Check if position exists
    const position = await prisma.position.findUnique({
      where: {
        id: positionId,
        electionId,
      },
      include: {
        _count: {
          select: { candidates: true },
        },
      },
    });

    if (!position) {
      return NextResponse.json(
        { error: "Position not found" },
        { status: 404 }
      );
    }

    // Check if position has candidates
    if (position._count.candidates > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete position with candidates. Remove candidates first.",
        },
        { status: 400 }
      );
    }

    // Delete the position
    await prisma.position.delete({
      where: {
        id: positionId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting position:", error);
    return NextResponse.json(
      { error: "Failed to delete position" },
      { status: 500 }
    );
  }
}
