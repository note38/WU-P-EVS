import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const now = new Date();
    console.log(
      `[AUTO-STATUS] Starting manual status check at ${now.toISOString()}`
    );

    // Find elections that need status updates
    const electionsToUpdate = await prisma.election.findMany({
      where: {
        OR: [
          // Elections that should be ACTIVE (current time is between start and end, and status is INACTIVE)
          {
            status: "INACTIVE",
            startDate: { lte: now },
            endDate: { gt: now },
          },
          // Elections that should be COMPLETED (current time is past end date, and status is not COMPLETED)
          {
            status: { not: "COMPLETED" },
            endDate: { lte: now },
          },
        ],
      },
    });

    if (electionsToUpdate.length === 0) {
      console.log("[AUTO-STATUS] No elections need status updates");
      return NextResponse.json({
        message: "No elections need status updates",
        updatedElections: [],
        timestamp: now.toISOString(),
        source: "manual",
      });
    }

    console.log(
      `[AUTO-STATUS] Found ${electionsToUpdate.length} elections needing updates`
    );

    const updatePromises = electionsToUpdate.map(async (election: any) => {
      let newStatus: "ACTIVE" | "COMPLETED";

      if (now >= election.endDate) {
        newStatus = "COMPLETED";
      } else if (
        election.status === "INACTIVE" &&
        now >= election.startDate &&
        now < election.endDate
      ) {
        newStatus = "ACTIVE";
      } else {
        return null; // No update needed
      }

      console.log(
        `[AUTO-STATUS] Updating election "${election.name}" from ${election.status} to ${newStatus}`
      );

      return prisma.election.update({
        where: { id: election.id },
        data: {
          status: newStatus,
          updatedAt: now,
        },
      });
    });

    // Filter out null values and execute updates
    const validUpdates = updatePromises.filter(
      (promise: any) => promise !== null
    );
    const updatedElections = await Promise.all(validUpdates);

    const successfulUpdates = updatedElections.filter(
      (election) => election !== null
    );

    console.log(
      `[AUTO-STATUS] Successfully updated ${successfulUpdates.length} elections`
    );

    return NextResponse.json({
      message: `Updated ${successfulUpdates.length} election(s)`,
      updatedElections: successfulUpdates.map((election) => ({
        id: election?.id,
        name: election?.name,
        status: election?.status,
      })),
      timestamp: now.toISOString(),
      source: "manual",
    });
  } catch (error) {
    console.error("[AUTO-STATUS] Error in auto status update:", error);
    return NextResponse.json(
      {
        error: "Failed to update election statuses",
        timestamp: new Date().toISOString(),
        source: "manual",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check which elections need updates without actually updating them
export async function GET() {
  try {
    const now = new Date();
    console.log('[API-ELECTION-STATUS] Starting status check at', now.toISOString());

    const electionsNeedingUpdate = await prisma.election.findMany({
      where: {
        OR: [
          {
            status: "INACTIVE",
            startDate: { lte: now },
            endDate: { gt: now },
          },
          {
            status: "ACTIVE",
            endDate: { lte: now },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
      },
    });

    const statusUpdates = electionsNeedingUpdate.map((election: any) => {
      let suggestedStatus: "ACTIVE" | "COMPLETED";

      if (
        election.status === "INACTIVE" &&
        now >= election.startDate &&
        now < election.endDate
      ) {
        suggestedStatus = "ACTIVE";
      } else if (election.status === "ACTIVE" && now >= election.endDate) {
        suggestedStatus = "COMPLETED";
      } else {
        suggestedStatus = election.status as "ACTIVE" | "COMPLETED";
      }

      return {
        id: election.id,
        name: election.name,
        currentStatus: election.status,
        suggestedStatus,
        startDate: election.startDate,
        endDate: election.endDate,
      };
    });

    return NextResponse.json({
      electionsNeedingUpdate: statusUpdates,
      count: statusUpdates.length,
    });
  } catch (error) {
    console.error("[API-ELECTION-STATUS] Error checking election statuses:", error);
    return NextResponse.json(
      { 
        error: "Failed to check election statuses",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
