import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// Handler to update the status of an election - using any type for context
async function updateElectionStatus(req: NextRequest, context: any) {
  try {
    // Get the authenticated user from session
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

    const params = await context.params;
    const electionId = parseInt(params.electionId);

    if (isNaN(electionId)) {
      return NextResponse.json(
        { error: "Invalid election ID" },
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
    const startDate = new Date(existingElection.startDate);
    const endDate = new Date(existingElection.endDate);

    // Enhanced validation for status changes
    if (data.status === "ACTIVE") {
      if (now >= endDate) {
        return NextResponse.json(
          { error: "Cannot start an election that has already ended" },
          { status: 400 }
        );
      }
      if (now < startDate) {
        return NextResponse.json(
          {
            error: "Cannot start an election before its scheduled start time",
            scheduledStart: startDate.toISOString(),
          },
          { status: 400 }
        );
      }
    }

    // Prevent manual changes to COMPLETED status if election hasn't ended
    if (data.status === "COMPLETED" && now < endDate) {
      return NextResponse.json(
        {
          error: "Cannot manually complete an election before its end time",
          scheduledEnd: endDate.toISOString(),
        },
        { status: 400 }
      );
    }

    // Allow pausing (INACTIVE) at any time during the election period
    if (data.status === "INACTIVE" && existingElection.status === "ACTIVE") {
      // This is allowed - admin can pause an active election
    }

    // Update the election status
    // If status is being set to COMPLETED, also set hideName to false
    const updateData: any = {
      status: data.status,
    };

    if (data.status === "COMPLETED") {
      updateData.hideName = false;
    }

    const updatedElection = await prisma.election.update({
      where: { id: electionId },
      data: updateData,
    });

    return NextResponse.json({
      message: `Election status updated to ${data.status.toLowerCase()}`,
      election: updatedElection,
      automaticUpdate: false, // This was a manual update
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

// Support both PUT and PATCH methods
export async function PUT(req: NextRequest, context: any) {
  return updateElectionStatus(req, context);
}

export async function PATCH(req: NextRequest, context: any) {
  return updateElectionStatus(req, context);
}
