import { authOptions } from "@/lib/draft";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// PATCH handler to update the status of an election - using any type for context
export async function PATCH(req: NextRequest, context: any) {
  try {
    // Get the authenticated user from session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse election ID from params
    const electionId = parseInt(context.params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID format" },
        { status: 400 }
      );
    }

    // Check if election exists
    const existingElection = await prisma.election.findUnique({
      where: { id: electionId },
    });

    if (!existingElection) {
      return NextResponse.json(
        { error: "Election not found" },
        { status: 404 }
      );
    }

    // Parse request body
    let data;
    try {
      data = await req.json();
    } catch (e) {
      console.error("JSON parsing error:", e);
      return NextResponse.json(
        { error: "Invalid JSON in request data" },
        { status: 400 }
      );
    }

    // Validate status field
    if (
      !data.status ||
      !["ACTIVE", "INACTIVE", "COMPLETED"].includes(data.status)
    ) {
      return NextResponse.json(
        {
          error: "Invalid status value. Must be ACTIVE, INACTIVE, or COMPLETED",
        },
        { status: 400 }
      );
    }

    // Check if the current time is within the election period
    const now = new Date();
    if (data.status === "ACTIVE") {
      if (now > new Date(existingElection.endDate)) {
        return NextResponse.json(
          { error: "Cannot start an election that has already ended" },
          { status: 400 }
        );
      }
    }

    // Update the election status
    const updatedElection = await prisma.election.update({
      where: { id: electionId },
      data: {
        status: data.status,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: `Election status updated to ${data.status.toLowerCase()}`,
      election: updatedElection,
    });
  } catch (error) {
    console.error("Error updating election status:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to update election status";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
