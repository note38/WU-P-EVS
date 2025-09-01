// app/api/elections/[electionId]/positions/[positionId]/route.ts
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

// GET /api/elections/[electionId]/positions/[positionId]
export async function GET(req: NextRequest, context: any) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from database to check if they're an admin
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/get-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = await userResponse.json();

    if (userData.type !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Safely extract and parse the electionId and positionId from context params
    if (
      !context.params ||
      !context.params.electionId ||
      !context.params.positionId
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const electionId = parseInt(context.params.electionId);
    const positionId = parseInt(context.params.positionId);

    if (isNaN(electionId) || isNaN(positionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

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
export async function PUT(req: NextRequest, context: any) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from database to check if they're an admin
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/get-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = await userResponse.json();

    if (userData.type !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Safely extract and parse the electionId and positionId from context params
    if (
      !context.params ||
      !context.params.electionId ||
      !context.params.positionId
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const electionId = parseInt(context.params.electionId);
    const positionId = parseInt(context.params.positionId);

    if (isNaN(electionId) || isNaN(positionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

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
export async function DELETE(req: NextRequest, context: any) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user data from database to check if they're an admin
    const userResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/get-user`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }
    );

    if (!userResponse.ok) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userData = await userResponse.json();

    if (userData.type !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Safely extract and parse the electionId and positionId from context params
    if (
      !context.params ||
      !context.params.electionId ||
      !context.params.positionId
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const electionId = parseInt(context.params.electionId);
    const positionId = parseInt(context.params.positionId);

    if (isNaN(electionId) || isNaN(positionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

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
